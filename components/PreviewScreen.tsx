import React, { useRef, useEffect, useCallback, useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RestartIcon } from './icons/RestartIcon';
import { BackIcon } from './icons/BackIcon';
import { Template, Event } from '../types';
import { getCachedImage } from '../utils/db';

interface PreviewScreenProps {
  images: Blob[];
  onRestart: () => void;
  onBack: () => void;
  template: Template;
  onSaveHistory: (imageDataUrl: string) => void;
  event: Event | null;
}

const TEMPLATE_WIDTH = 1200;
const TEMPLATE_HEIGHT = 1800;
const PROXY_PREFIX = 'https://api.allorigins.win/raw?url=';

// Helper untuk memuat URL gambar eksternal (templat) ke dalam ImageBitmap.
// Ini menangani caching dan pengambilan melalui proxy.
const loadTemplateImageAsBitmap = async (src: string): Promise<ImageBitmap> => {
    try {
        let blob: Blob | null = await getCachedImage(src);

        if (!blob) {
            console.warn(`Gambar templat tidak ditemukan di cache. Mengambil melalui proxy: ${src}`);
            
            let fetchUrl = src;
            if (src.startsWith('http')) {
                try {
                    new URL(src); // Validate URL
                    fetchUrl = `${PROXY_PREFIX}${encodeURIComponent(src)}`;
                } catch (e) {
                     console.error(`Invalid URL provided for proxying: ${src}`);
                     // Error will be thrown by fetch below if URL is malformed
                }
            }
            
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`Gagal mengambil gambar. Status: ${response.status}`);
            }
            blob = await response.blob();
        }
        
        // Dekode blob menjadi ImageBitmap di luar thread utama
        return await createImageBitmap(blob);

    } catch (error) {
        console.error(`Kesalahan kritis saat memuat gambar templat dari ${src}:`, error);
        throw error; // Lemparkan kembali error untuk ditangani oleh drawCanvas
    }
};


const PreviewScreen: React.FC<PreviewScreenProps> = ({ images, onRestart, onBack, template, onSaveHistory, event }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageRef = useRef<HTMLImageElement>(null);
  const historySavedRef = useRef(false);
  const downloadTriggeredRef = useRef(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = useCallback((imageDataUrl?: string) => {
    const url = imageDataUrl || canvasRef.current?.toDataURL('image/png');
    if (url) {
      const link = document.createElement('a');
      link.download = `sans-photo-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, []);

  const drawCanvas = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) {
        setErrorMsg("Tidak ada gambar yang diambil.");
        setIsLoading(false);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setErrorMsg("Tidak dapat memperoleh konteks kanvas.");
        setIsLoading(false);
        return;
    }
      
    const templateAspectRatio = template.widthMM / template.heightMM;
    const canvasWidth = TEMPLATE_WIDTH;
    const canvasHeight = canvasWidth / templateAspectRatio;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let templateBitmap: ImageBitmap | null = null;
    let loadedImageBitmaps: ImageBitmap[] = [];

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,canvas.width, canvas.height);

      // Membuat ImageBitmaps secara bersamaan untuk kinerja maksimum
      const templateBitmapPromise = loadTemplateImageAsBitmap(template.imageUrl);
      const capturedBitmapsPromises = images.map(blob => createImageBitmap(blob));

      const [templateBmp, ...loadedBmps] = await Promise.all([
          templateBitmapPromise,
          ...capturedBitmapsPromises
      ]);
      templateBitmap = templateBmp;
      loadedImageBitmaps = loadedBmps;


      // Gambar foto yang diambil dan pangkas agar sesuai dengan slot
      template.photoSlots.forEach(slot => {
        if (!slot) return;
        // inputId berbasis 1, loadedImageBitmaps berbasis 0
        const bitmap = loadedImageBitmaps[slot.inputId - 1];
        if (!bitmap) return;
        
        ctx.save();
        // Balikkan secara horizontal agar sesuai dengan pratinjau kamera
        ctx.scale(-1, 1);
        ctx.translate(-canvasWidth, 0);

        const slotAspectRatio = slot.width / slot.height;
        const imgAspectRatio = bitmap.width / bitmap.height;
        
        let sx, sy, sWidth, sHeight;

        if (imgAspectRatio > slotAspectRatio) {
            // Gambar lebih lebar dari slot
            sHeight = bitmap.height;
            sWidth = sHeight * slotAspectRatio;
            sx = (bitmap.width - sWidth) / 2;
            sy = 0;
        } else {
            // Gambar lebih tinggi dari slot
            sWidth = bitmap.width;
            sHeight = sWidth / slotAspectRatio;
            sx = 0;
            sy = (bitmap.height - sHeight) / 2;
        }
        const destX = (slot.x / TEMPLATE_WIDTH) * canvasWidth;
        const destY = (slot.y / TEMPLATE_HEIGHT) * canvasHeight;
        const destWidth = (slot.width / TEMPLATE_WIDTH) * canvasWidth;
        const destHeight = (slot.height / TEMPLATE_HEIGHT) * canvasHeight;


        ctx.drawImage(bitmap, sx, sy, sWidth, sHeight, canvasWidth - destX - destWidth, destY, destWidth, destHeight);
        ctx.restore();
        // JANGAN tutup bitmap di sini karena bisa digunakan oleh slot lain
      });

      // Gambar templat di atasnya
      ctx.drawImage(templateBitmap, 0, 0, canvasWidth, canvasHeight);
      
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
      console.error("Kesalahan saat menggambar kanvas:", error);
      setErrorMsg("Tidak dapat menghasilkan gambar akhir. Templat mungkin tidak tersedia atau ada masalah jaringan.");
    } finally {
        // Selalu bersihkan sumber daya setelah selesai
        templateBitmap?.close();
        loadedImageBitmaps.forEach(bitmap => bitmap.close());
        setIsLoading(false);
    }
  }, [images, template, onSaveHistory, handleDownload]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="relative flex flex-col items-center p-4 min-h-screen justify-center">
       <div className="absolute top-4 left-4">
        <button 
          onClick={onBack}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label="Kembali"
        >
          <BackIcon />
        </button>
      </div>
      <h2 className="font-bebas text-4xl mb-4">Ini Foto Anda!</h2>
      
      <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8">
    
        {/* Kolom Foto */}
        <div className="relative w-full max-w-sm">
            {isLoading && (
                <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-gray-300">Membuat karya agung Anda...</p>
                </div>
            )}
            {errorMsg && (
                <div className="w-full aspect-[2/3] bg-red-900/30 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <p className="font-bold text-red-300">Oops! Terjadi kesalahan.</p>
                    <p className="text-sm text-red-200 mt-2">{errorMsg}</p>
                    <button
                        onClick={drawCanvas}
                        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}
            <img ref={finalImageRef} alt="Gambar photobooth akhir Anda" className={`w-full rounded-lg shadow-2xl shadow-purple-500/30 ${isLoading || errorMsg ? 'hidden' : 'block'}`} />
        </div>
        
        {/* Kolom Aksi & QR */}
        <div className="flex flex-col items-center lg:items-start gap-6 w-full max-w-sm lg:max-w-xs">
            {event?.isQrCodeEnabled && event.qrCodeImageUrl && (
                <div className="p-4 bg-gray-800 rounded-lg text-center lg:text-left">
                    <p className="text-sm text-gray-300 mb-2">Pindai Kode QR</p>
                    <img src={event.qrCodeImageUrl} alt="Kode QR" className="w-32 h-32 mx-auto lg:mx-0 rounded-md" />
                </div>
            )}

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full">
                <button
                  onClick={() => handleDownload()}
                  disabled={isLoading || !!errorMsg}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <DownloadIcon />
                  Unduh
                </button>
                <button
                  onClick={onRestart}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <RestartIcon />
                  Mulai Ulang
                </button>
            </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default PreviewScreen;
