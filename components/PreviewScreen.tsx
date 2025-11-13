import React, { useRef, useEffect, useCallback } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RestartIcon } from './icons/RestartIcon';
import { BackIcon } from './icons/BackIcon';
import { Template, Event } from '../types';

interface PreviewScreenProps {
  images: string[];
  onRestart: () => void;
  onBack: () => void;
  template: Template;
  onSaveHistory: (imageDataUrl: string) => void;
  event: Event | null;
}

const TEMPLATE_WIDTH = 1200;
const TEMPLATE_HEIGHT = 1800;

const loadImage = (src: string, isCrossOrigin: boolean = false): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (isCrossOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${src} - ${err}`));
  });
};

const PreviewScreen: React.FC<PreviewScreenProps> = ({ images, onRestart, onBack, template, onSaveHistory, event }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageRef = useRef<HTMLImageElement>(null);
  const historySavedRef = useRef(false);

  useEffect(() => {
    const drawCanvas = async () => {
      const canvas = canvasRef.current;
      if (!canvas || images.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const templateAspectRatio = template.widthMM / template.heightMM;
      const canvasWidth = TEMPLATE_WIDTH;
      const canvasHeight = canvasWidth / templateAspectRatio;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,canvas.width, canvas.height);

      try {
        const imagePromises: Promise<HTMLImageElement>[] = [
          loadImage(template.imageUrl, true), // Load template
          ...images.map(src => loadImage(src)) // Load captured images
        ];

        const [templateImg, ...loadedImages] = await Promise.all(imagePromises);

        // Draw captured images cropped to fit slots
        template.photoSlots.forEach(slot => {
          if (!slot) return;
          // inputId is 1-based, loadedImages is 0-based
          const img = loadedImages[slot.inputId - 1];
          if (!img) return;
          
          ctx.save();
          // Flip horizontally to match camera preview
          ctx.scale(-1, 1);
          ctx.translate(-canvasWidth, 0);

          const slotAspectRatio = slot.width / slot.height;
          const imgAspectRatio = img.width / img.height;
          
          let sx, sy, sWidth, sHeight;

          if (imgAspectRatio > slotAspectRatio) {
              // Image is wider than the slot
              sHeight = img.height;
              sWidth = sHeight * slotAspectRatio;
              sx = (img.width - sWidth) / 2;
              sy = 0;
          } else {
              // Image is taller than the slot
              sWidth = img.width;
              sHeight = sWidth / slotAspectRatio;
              sx = 0;
              sy = (img.height - sHeight) / 2;
          }
          const destX = (slot.x / TEMPLATE_WIDTH) * canvasWidth;
          const destY = (slot.y / TEMPLATE_HEIGHT) * canvasHeight;
          const destWidth = (slot.width / TEMPLATE_WIDTH) * canvasWidth;
          const destHeight = (slot.height / TEMPLATE_HEIGHT) * canvasHeight;


          ctx.drawImage(img, sx, sy, sWidth, sHeight, canvasWidth - destX - destWidth, destY, destWidth, destHeight);
          ctx.restore();
        });

        // Draw template on top
        ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
        
        if(finalImageRef.current) {
            const finalImageDataUrl = canvas.toDataURL('image/png');
            finalImageRef.current.src = finalImageDataUrl;
            if (onSaveHistory && !historySavedRef.current) {
                onSaveHistory(finalImageDataUrl);
                historySavedRef.current = true;
            }
        }
      } catch (error) {
        console.error("Error drawing canvas:", error);
      }
    };

    drawCanvas();
  }, [images, template, onSaveHistory]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'sans-photo-result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center p-4 min-h-screen justify-center">
       <div className="absolute top-4 left-4">
        <button 
          onClick={onBack}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>
      <h2 className="font-bebas text-4xl mb-4">Here's Your Photo!</h2>
      <div className="relative w-full max-w-sm">
        <img ref={finalImageRef} alt="Your final photobooth picture" className="w-full rounded-lg shadow-2xl shadow-purple-500/30" />
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {event?.isQrCodeEnabled && event.qrCodeImageUrl && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-2">Scan QR Code</p>
              <img src={event.qrCodeImageUrl} alt="QR Code" className="w-32 h-32 mx-auto rounded-md" />
          </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={handleDownload}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <DownloadIcon />
          Download
        </button>
        <button
          onClick={onRestart}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <RestartIcon />
          Start Over
        </button>
      </div>
    </div>
  );
};

export default PreviewScreen;