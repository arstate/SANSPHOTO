
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Template } from '../types';

interface PreviewScreenProps {
  images: string[];
  onRestart: () => void;
  template: Template;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({ images, onRestart, template }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finalImageSrc, setFinalImageSrc] = useState<string | null>(null);
  
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const drawCanvas = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMsg("Tidak dapat membuat gambar akhir.");
      setIsLoading(false);
      return;
    }
      
    canvas.width = TEMPLATE_WIDTH;
    canvas.height = TEMPLATE_HEIGHT;

    try {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loadedImages = await Promise.all(images.map(src => loadImage(src)));

      template.photoSlots.forEach(slot => {
        const img = loadedImages[slot.inputId - 1];
        if (!img) return;
        
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        const sRatio = img.width / img.height;
        const dRatio = slot.width / slot.height;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        if (sRatio > dRatio) {
            sWidth = img.height * dRatio;
            sx = (img.width - sWidth) / 2;
        } else {
            sHeight = img.width / dRatio;
            sy = (img.height - sHeight) / 2;
        }

        const dx = canvas.width - slot.x - slot.width;
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, slot.y, slot.width, slot.height);
        ctx.restore();
      });

      if (template.imageUrl && !template.imageUrl.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg')) {
        const templateImg = await loadImage(template.imageUrl);
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
      }
      
      setFinalImageSrc(canvas.toDataURL('image/png'));

    } catch (error) {
      console.error("Error drawing canvas:", error);
      setErrorMsg("Gagal memuat sumber daya gambar.");
    } finally {
        setIsLoading(false);
    }
  }, [images, template, TEMPLATE_WIDTH, TEMPLATE_HEIGHT]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    if (finalImageSrc) {
      const link = document.createElement('a');
      link.download = `sans-photo-${Date.now()}.png`;
      link.href = finalImageSrc;
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      <h2 className="font-bebas text-4xl mb-4">Ini Hasil Fotomu!</h2>
      
      <div className="relative w-full max-w-md">
        <canvas ref={canvasRef} className="hidden" />
        {isLoading && <div className="aspect-[2/3] w-full bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center"><p>Membuat gambar...</p></div>}
        {errorMsg && <div className="aspect-[2/3] w-full bg-red-900/50 rounded-lg flex items-center justify-center"><p>{errorMsg}</p></div>}
        {finalImageSrc && !isLoading && (
            <img src={finalImageSrc} alt="Final photobooth result" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleDownload}
          disabled={isLoading || !!errorMsg}
          className="w-full flex-1 bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed"
        >
          Unduh
        </button>
        <button
          onClick={onRestart}
          className="w-full flex-1 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
        >
          Selesai
        </button>
      </div>
    </div>
  );
};

export default PreviewScreen;
