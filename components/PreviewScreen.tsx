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
  return new Promise(async (resolve, reject) => {
    // If it's a data URL or not intended to be cross-origin, load it directly.
    if (src.startsWith('data:') || !isCrossOrigin) {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`Failed to load image directly: ${src} - ${err.toString()}`));
      return;
    }

    // For cross-origin images, fetch as a blob to bypass canvas tainting issues.
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        // Revoke the object URL after the image is loaded to prevent memory leaks.
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image from blob URL: ${src} - ${err.toString()}`));
      };
    } catch (error) {
        console.error("Error fetching cross-origin image:", error);
        reject(new Error(`Failed to fetch cross-origin image: ${src} - ${error}`));
    }
  });
};


const PreviewScreen: React.FC<PreviewScreenProps> = ({ images, onRestart, onBack, template, onSaveHistory, event }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageRef = useRef<HTMLImageElement>(null);
  const historySavedRef = useRef(false);
  const downloadTriggeredRef = useRef(false);

  const handleDownload = useCallback((imageDataUrl?: string) => {
    const url = imageDataUrl || canvasRef.current?.toDataURL('image/png');
    if (url) {
      const link = document.createElement('a');
      link.download = `sans-photo-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, []);

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
          loadImage(template.imageUrl, true), // Load template cross-origin safely
          ...images.map(src => loadImage(src)) // Load captured images (data URLs)
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
        
        const finalImageDataUrl = canvas.toDataURL('image/png');

        if(finalImageRef.current) {
            finalImageRef.current.src = finalImageDataUrl;
        }
        
        if (onSaveHistory && !historySavedRef.current) {
            onSaveHistory(finalImageDataUrl);
            historySavedRef.current = true;
        }

        if (!downloadTriggeredRef.current) {
            handleDownload(finalImageDataUrl);
            downloadTriggeredRef.current = true;
        }

      } catch (error) {
        console.error("Error drawing canvas:", error);
      }
    };

    drawCanvas();
  }, [images, template, onSaveHistory, handleDownload]);

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
      
      <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8">
    
        {/* Photo Column */}
        <div className="relative w-full max-w-sm">
            <img ref={finalImageRef} alt="Your final photobooth picture" className="w-full rounded-lg shadow-2xl shadow-purple-500/30" />
        </div>
        
        {/* Actions & QR Column */}
        <div className="flex flex-col items-center lg:items-start gap-6 w-full max-w-sm lg:max-w-xs">
            {event?.isQrCodeEnabled && event.qrCodeImageUrl && (
                <div className="p-4 bg-gray-800 rounded-lg text-center lg:text-left">
                    <p className="text-sm text-gray-300 mb-2">Scan QR Code</p>
                    <img src={event.qrCodeImageUrl} alt="QR Code" className="w-32 h-32 mx-auto lg:mx-0 rounded-md" />
                </div>
            )}

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full">
                <button
                  onClick={() => handleDownload()}
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
      </div>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default PreviewScreen;