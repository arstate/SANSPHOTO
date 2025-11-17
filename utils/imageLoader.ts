import { getCachedImage, storeImageInCache } from './db';

// Cache for ongoing fetch promises to avoid duplicate requests
const ongoingRequests = new Map<string, Promise<Blob>>();

/**
 * Helper to convert a data URL to a Blob.
 * @param dataurl The data URL string.
 * @returns A promise that resolves with the Blob.
 */
const dataURLtoBlob = async (dataurl: string): Promise<Blob> => {
    const res = await fetch(dataurl);
    return res.blob();
}

/**
 * A robust, cache-first image loading utility.
 * - Handles data URLs, network URLs, and cached blobs.
 * - If not found in cache, fetches from the network via a CORS proxy.
 * - Caches the fetched image in IndexedDB for future use.
 * - Prevents duplicate concurrent requests for the same image URL.
 * @param src The original URL of the image to load.
 * @returns A promise that resolves with the image Blob.
 */
export const getImageBlob = (src: string): Promise<Blob> => {
  if (!src) {
    return Promise.reject(new Error('Image source URL is empty.'));
  }
  
  // Handle data URLs directly without caching
  if (src.startsWith('data:')) {
    return dataURLtoBlob(src);
  }

  // 1. Check if a request for this src is already in progress
  if (ongoingRequests.has(src)) {
    return ongoingRequests.get(src)!;
  }

  // 2. Create a new promise for this request and store it
  const requestPromise = new Promise<Blob>(async (resolve, reject) => {
    try {
      // 3. Try to get the image from the local cache first
      const cachedBlob = await getCachedImage(src);
      if (cachedBlob) {
        resolve(cachedBlob);
        return;
      }

      // 4. If not in cache, fetch from the network
      let fetchUrl = src;
      // Use a reliable image proxy for external URLs
      if (src.startsWith('http')) {
        // We use images.weserv.nl, which is a specialized and reliable image proxy.
        // It requires the URL without the protocol scheme.
        const urlWithoutScheme = src.replace(/^https?:\/\//, '');
        fetchUrl = `https://images.weserv.nl/?url=${urlWithoutScheme}`;
      }
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Network fetch failed with status: ${response.status}`);
      }
      const networkBlob = await response.blob();

      // 5. Store the newly fetched blob in the cache for next time
      try {
        await storeImageInCache(src, networkBlob);
      } catch (cacheError) {
        console.warn(`Could not cache image for ${src}:`, cacheError);
      }
      
      // 6. Resolve the promise with the fetched blob
      resolve(networkBlob);

    } catch (error) {
      console.error(`Failed to load image blob for ${src}:`, error);
      reject(error);
    }
  });
  
  // Store the promise and clean up when it's done
  ongoingRequests.set(src, requestPromise);
  requestPromise.finally(() => {
    ongoingRequests.delete(src);
  });

  return requestPromise;
};