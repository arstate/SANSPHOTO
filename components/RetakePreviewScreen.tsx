import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Template } from '../types';
import { getCachedImage, storeImageInCache } from '../utils/db';
import { RestartIcon } from './icons/RestartIcon';
import { CheckIcon } from './icons/CheckIcon';
import { UploadingIcon } from './icons/UploadingIcon';

// URL Google Apps Script untuk menangani unggahan
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMNj-A6CT9KOC1Zd5ZpPGktv9PWYcpOjWIt_TrEyAqvBm2TVtKebNy7D2zuFCKPyKQ3w/exec';

interface RetakePreviewScreenProps {
  images: string[];
  template: Template;
  onStartRetake: (photoIndex: number) => void;
  onDone: () => void;
  retakesUsed: number;
  maxRetakes: number;
}

const RetakePreviewScreen: React.FC<RetakePreviewScreenProps> = ({
  images, template, onStartRetake, onDone, retakesUsed, maxRetakes
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;
  
  const numericMaxRetakes = Number(maxRetakes);
  const canRetake = retakesUsed < numericMaxRetakes;
  const uniqueInputIds: number[] = Array.from(new Set<number>(template.photoSlots.map(s => s.inputId))).sort((a, b) => a - b);

  const drawCanvas = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) {
      setErrorMsg("No images captured.");
      setIsLoading(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMsg("Could not get canvas context.");
      setIsLoading(false);
      return;
    }
      
    canvas.width = TEMPLATE_WIDTH;
    canvas.height = TEMPLATE_HEIGHT;

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise(async (resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => reject(new Error(`Failed to load image from src: ${src.substring(0, 50)}...`));

        if (src.startsWith('data:')) {
            img.src = src;
            return;
        }
        
        try {
            const cachedBlob = await getCachedImage(src);
            if (cachedBlob) {
                img.src = URL.createObjectURL(cachedBlob);
                return;
            }

            const fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const networkBlob = await response.blob();
            await storeImageInCache(src, networkBlob);
            img.src = URL.createObjectURL(networkBlob);
        } catch(e) {
            reject(e);
        }
      });

      const imagePromises: Promise<HTMLImageElement>[] = [
        loadImage(template.imageUrl), 
        ...images.map(src => loadImage(src))
      ];
      
      const [templateImg, ...loadedImages] = await Promise.all(imagePromises);

      template.photoSlots.forEach(slot => {
        const img = loadedImages[slot.inputId - 1];
        if (!img) return;
        
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-TEMPLATE_WIDTH, 0);

        const slotAspectRatio = slot.width / slot.height;
        const imgAspectRatio = img.width / img.height;
        
        let sx, sy, sWidth, sHeight;
        if (imgAspectRatio > slotAspectRatio) {
            sHeight = img.height;
            sWidth = sHeight * slotAspectRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = img.width;
            sHeight = sWidth / slotAspectRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
        }
        const destX = slot.x;
        const destY = slot.y;
        const destWidth = slot.width;
        const destHeight = slot.height;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, TEMPLATE_WIDTH - destX - destWidth, destY, destWidth, destHeight);
        ctx.restore();
      });

      ctx.drawImage(templateImg, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
      
      const finalImageDataUrl = canvas.toDataURL('image/png');
      if(finalImageRef.current) {
          finalImageRef.current.src = finalImageDataUrl;
      }
      setIsLoading(false);

    } catch (error) {
      console.error("Error drawing canvas:", error);
      setErrorMsg("Could not generate the final image. The template might be unavailable or there was a network issue.");
      setIsLoading(false);
    }
  }, [images, template, TEMPLATE_WIDTH, TEMPLATE_HEIGHT]);

  const handleUploadAndContinue = useCallback(async () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'success') return;

    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMsg("Canvas not available for upload.");
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    // Bersihkan interval sebelumnya jika ada
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    // Simulasi progres palsu
    progressIntervalRef.current = window.setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6);
      const filename = `sans-photo-${Date.now()}.jpg`;
      const payload = JSON.stringify({ foto: imageDataUrl, nama: filename });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: payload,
      });
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadProgress(100);
      setUploadStatus('success');

      setTimeout(() => {
        onDone();
      }, 1500);

    } catch (error) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error("Upload failed:", error);
      setUploadStatus('error');
    }
  }, [uploadStatus, onDone]);

  useEffect(() => {
    drawCanvas();
    
    // Cleanup interval on component unmount
    return () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
    }
  }, [drawCanvas]);
  
  const isActionDisabled = isLoading || !!errorMsg || uploadStatus === 'uploading' || uploadStatus === 'success';

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full p-4">
      <h2 className="font-bebas text-4xl mb-2 shrink-0">Review Your Photos</h2>
      <p className="text-md text-[var(--color-text-muted)] mb-4 shrink-0">
          Happy with your photos? Click 'Done'. Want to change one? Click the retake icon.
      </p>

      <main className="w-full max-w-6xl flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8 flex-grow min-h-0">
    
        <div className={`relative w-full max-w-lg ${isLandscape ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center">
                    <p className="text-[var(--color-text-secondary)]">Generating Preview...</p>
                </div>
            )}
            {errorMsg && (
                <div className="absolute inset-0 bg-red-900/30 border-2 border-red-500 rounded-lg flex items-center justify-center p-4 text-center">
                    <p className="text-red-200">{errorMsg}</p>
                </div>
            )}
            <div className="relative">
                <img ref={finalImageRef} alt="Your photobooth final image" className={`w-full h-full object-contain rounded-lg shadow-2xl shadow-[var(--color-accent-primary)]/30 ${isLoading || errorMsg ? 'hidden' : 'block'}`} />

                {uniqueInputIds.map((inputId) => {
                    const primarySlot = template.photoSlots.find(s => s.inputId === inputId);
                    if (!primarySlot) return null;

                    return (
                        <div 
                            key={`retake-overlay-${inputId}`} 
                            className="absolute"
                            style={{
                                left: `${(primarySlot.x / TEMPLATE_WIDTH) * 100}%`,
                                top: `${(primarySlot.y / TEMPLATE_HEIGHT) * 100}%`,
                                width: `${(primarySlot.width / TEMPLATE_WIDTH) * 100}%`,
                                height: `${(primarySlot.height / TEMPLATE_HEIGHT) * 100}%`,
                            }}
                        >
                            {canRetake && (
                                <button
                                    onClick={() => onStartRetake(inputId - 1)}
                                    disabled={isActionDisabled}
                                    className="absolute top-2 right-2 w-12 h-12 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full transition-all transform hover:scale-110 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-black/50 ring-white flex items-center justify-center border-2 border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Retake photo ${inputId}`}
                                >
                                    <RestartIcon />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-full text-center bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)]">
                <p className="text-xl font-bold">Retakes Remaining:</p>
                <p className={`text-4xl font-bebas tracking-wider ${canRetake ? 'text-[var(--color-text-accent)]' : 'text-red-500'}`}>
                    {Math.max(0, numericMaxRetakes - retakesUsed)}
                </p>
            </div>
            <button
                onClick={handleUploadAndContinue}
                disabled={isActionDisabled}
                className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed"
            >
                {uploadStatus === 'uploading' && <UploadingIcon />}
                {uploadStatus !== 'uploading' && <CheckIcon />}
                <span>
                    {uploadStatus === 'idle' && 'Done & Continue'}
                    {uploadStatus === 'uploading' && 'Uploading...'}
                    {uploadStatus === 'success' && 'Success!'}
                    {uploadStatus === 'error' && 'Retry Upload'}
                </span>
            </button>
            {uploadStatus === 'error' && (
              <p className="text-center text-sm text-red-400">Upload failed. Please check your connection and try again.</p>
            )}
        </div>
      </main>
      
      <canvas ref={canvasRef} className="hidden"></canvas>

      {uploadStatus === 'uploading' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-secondary)]/80 backdrop-blur-sm z-50 transition-opacity duration-300">
            <div className="max-w-md mx-auto text-center">
                <div className="flex justify-between mb-1 text-sm font-medium text-[var(--color-text-primary)]">
                  <span>Uploading to Gallery...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-[var(--color-border-secondary)] rounded-full h-2.5">
                  <div
                    className="bg-[var(--color-info)] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RetakePreviewScreen;
