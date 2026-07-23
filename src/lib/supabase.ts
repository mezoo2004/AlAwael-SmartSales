import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const isPlaceholder = (value: string | undefined): boolean => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized.includes('placeholder') ||
    normalized.includes('replace') ||
    normalized.includes('paste') ||
    normalized.includes('your-');
};

const isValidSupabaseUrl = (value: string | undefined): boolean => {
  if (!value || isPlaceholder(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) &&
  supabaseAnonKey &&
  !isPlaceholder(supabaseAnonKey)
);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        flowType: 'pkce',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'alawael-smart-sales-web',
        },
      },
    });
  }

  return client;
}

export function getSupabaseConfigWarning(): string | null {
  if (isSupabaseConfigured) return null;

  if (!isValidSupabaseUrl(supabaseUrl)) {
    return 'Supabase is not configured: set VITE_SUPABASE_URL to your project URL.';
  }

  if (!supabaseAnonKey || isPlaceholder(supabaseAnonKey)) {
    return 'Supabase is not configured: set VITE_SUPABASE_ANON_KEY to your public anon key.';
  }

  return 'Supabase is not configured.';
}
