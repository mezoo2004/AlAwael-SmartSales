import React, { useEffect, useState } from 'react';
import type { GeneratedDesign } from '../../types';
import {
  getImmediateDesignImageUrl,
  resolveDesignImageUrl,
} from '../../services/designImageUrlService';

interface DesignImageProps {
  design: GeneratedDesign;
  projectId?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Displays a design image using storage_path + fresh signed URL when needed.
 * Demo / legacy HTTP URLs continue to work unchanged.
 */
export const DesignImage: React.FC<DesignImageProps> = ({
  design,
  projectId,
  alt,
  className,
}) => {
  const [src, setSrc] = useState(() => getImmediateDesignImageUrl(design));

  useEffect(() => {
    let cancelled = false;
    setSrc(getImmediateDesignImageUrl(design));

    void resolveDesignImageUrl({
      id: design.id,
      generatedDesignId: design.generatedDesignId,
      projectId: projectId || null,
      imageUrl: design.imageUrl,
      thumbnailUrl: design.thumbnailUrl,
      storagePath: design.storagePath,
      source: design.source,
    }).then((resolved) => {
      if (!cancelled && resolved.url) {
        setSrc(resolved.url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    design.id,
    design.generatedDesignId,
    design.imageUrl,
    design.thumbnailUrl,
    design.storagePath,
    design.source,
    projectId,
  ]);

  return (
    <img
      src={src}
      alt={alt || design.title}
      className={className}
    />
  );
};

export default DesignImage;
