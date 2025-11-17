import { useState, useEffect } from 'react';
import { getImageBlob } from '../utils/imageLoader';

type ImageStatus = 'loading' | 'loaded' | 'error';

/**
 * A React hook to load an image using the centralized, cache-first image loader.
 * @param src The original URL of the image to load.
 * @returns An object containing the image source URL (as a blob URL) and the loading status.
 */
const useCachedImage = (src: string): { imageSrc: string | null; status: ImageStatus } => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (!src) {
        if (isMounted) setStatus('error');
        return;
      }
      
      setStatus('loading');
      
      try {
        const blob = await getImageBlob(src);
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
          setStatus('loaded');
        }
      } catch (error) {
        console.error(`useCachedImage failed for ${src}:`, error);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        // Revoke the blob URL to free up memory when the component unmounts
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return { imageSrc, status };
};

export default useCachedImage;
