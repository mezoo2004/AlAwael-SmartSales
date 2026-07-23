/**
 * Resolve design image URLs safely.
 *
 * Rules:
 * 1. Demo source with image_url → use image_url (e.g. Pexels demo assets).
 * 2. storage_path present → request a fresh signed URL via Edge Function (service role).
 * 3. No storage_path but image_url → legacy fallback.
 * 4. Otherwise → placeholder.
 *
 * Never uses the Supabase service role key in the browser.
 */

import { getSupabase } from '../lib/supabase';

export const DESIGN_IMAGE_PLACEHOLDER = '/brand/welcome-background.png';

/** Short-lived display URLs only; storage_path remains the permanent reference. */
export const DESIGN_SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export type DesignImageSource = 'demo' | 'openai' | 'storage' | string;

export interface DesignImageRef {
  id?: string;
  generatedDesignId?: string;
  projectId?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  storagePath?: string | null;
  source?: DesignImageSource | null;
}

export type DesignImageResolutionFrom = 'demo' | 'signed' | 'legacy' | 'placeholder';

export interface DesignImageResolution {
  url: string;
  from: DesignImageResolutionFrom;
  expiresInSeconds?: number;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}

const isHttpUrl = (value: string | null | undefined): value is string => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
};

const isDemoSource = (source?: DesignImageSource | null): boolean => {
  if (!source) return false;
  return String(source).toLowerCase() === 'demo';
};

type ResolveImageEdgeSuccess = {
  success: true;
  url: string;
  expiresInSeconds?: number;
};

type ResolveImageEdgeFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
};

/**
 * Ask the Edge Function (service role) for a fresh signed URL.
 * Requires projectId + designId (generated_designs.id).
 */
export async function requestFreshSignedDesignUrl(params: {
  projectId: string;
  designId: string;
}): Promise<DesignImageResolution> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      url: DESIGN_IMAGE_PLACEHOLDER,
      from: 'placeholder',
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'تعذر تحميل صورة التصميم.',
        retryable: false,
      },
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-design', {
      body: {
        action: 'resolve-image',
        projectId: params.projectId,
        designId: params.designId,
      },
    });

    if (error) {
      return {
        url: DESIGN_IMAGE_PLACEHOLDER,
        from: 'placeholder',
        error: {
          code: 'SIGNED_URL_REQUEST_FAILED',
          message: 'تعذر تحميل صورة التصميم.',
          retryable: true,
        },
      };
    }

    const response = data as ResolveImageEdgeSuccess | ResolveImageEdgeFailure | null;
    if (!response || typeof response !== 'object' || !response.success || !('url' in response) || !response.url) {
      const failure = response && 'success' in response && response.success === false
        ? response.error
        : undefined;
      return {
        url: DESIGN_IMAGE_PLACEHOLDER,
        from: 'placeholder',
        error: {
          code: failure?.code || 'SIGNED_URL_REQUEST_FAILED',
          message: failure?.message || 'تعذر تحميل صورة التصميم.',
          retryable: failure?.retryable ?? true,
        },
      };
    }

    return {
      url: response.url,
      from: 'signed',
      expiresInSeconds: response.expiresInSeconds ?? DESIGN_SIGNED_URL_TTL_SECONDS,
    };
  } catch {
    return {
      url: DESIGN_IMAGE_PLACEHOLDER,
      from: 'placeholder',
      error: {
        code: 'SIGNED_URL_REQUEST_FAILED',
        message: 'تعذر تحميل صورة التصميم.',
        retryable: true,
      },
    };
  }
}

/**
 * Resolve a displayable design image URL without treating signed URLs as permanent.
 */
export async function resolveDesignImageUrl(
  ref: DesignImageRef
): Promise<DesignImageResolution> {
  const directUrl = ref.imageUrl || ref.thumbnailUrl || null;
  const storagePath = ref.storagePath?.trim() || null;
  const designId = ref.generatedDesignId || ref.id;
  const projectId = ref.projectId || null;

  // 1) Demo assets — permanent public/demo URLs
  if (isDemoSource(ref.source) && isHttpUrl(directUrl)) {
    return { url: directUrl, from: 'demo' };
  }

  // 2) Private Storage — refresh signed URL from storage_path
  if (storagePath && projectId && designId) {
    const signed = await requestFreshSignedDesignUrl({
      projectId,
      designId,
    });
    if (signed.from === 'signed') {
      return signed;
    }
    // Fall through to legacy image_url if signing fails
  }

  // 3) Legacy fallback (old rows / current-session temporary URL)
  if (isHttpUrl(directUrl)) {
    return { url: directUrl, from: 'legacy' };
  }

  // 4) Placeholder
  return {
    url: DESIGN_IMAGE_PLACEHOLDER,
    from: 'placeholder',
    error: {
      code: 'DESIGN_IMAGE_MISSING',
      message: 'لا توجد صورة متاحة لهذا التصميم.',
      retryable: false,
    },
  };
}

/** Synchronous best-effort URL for immediate render before async refresh. */
export function getImmediateDesignImageUrl(ref: DesignImageRef): string {
  if (isDemoSource(ref.source) && isHttpUrl(ref.imageUrl || ref.thumbnailUrl)) {
    return (ref.imageUrl || ref.thumbnailUrl)!;
  }
  if (isHttpUrl(ref.imageUrl)) return ref.imageUrl;
  if (isHttpUrl(ref.thumbnailUrl)) return ref.thumbnailUrl!;
  return DESIGN_IMAGE_PLACEHOLDER;
}
