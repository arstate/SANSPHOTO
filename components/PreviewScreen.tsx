
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { PrintIcon } from './icons/PrintIcon';
import { CheckIcon } from './icons/CheckIcon';
import { BackIcon } from './icons/BackIcon';
import { RestartIcon } from './icons/RestartIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Template, Event, Settings } from '../types';
import { getCachedImage, storeImageInCache } from '../utils/db';

// Declare QRCode global from CDN
declare const QRCode: any;

type PrintSettings = {
  isEnabled: boolean;
  paperSize: NonNullable<Settings['printPaperSize']>;
  colorMode: NonNullable<Settings['printColorMode']>;
  isCopyInputEnabled: boolean;
  maxCopies: number;
}
interface PreviewScreenProps {
  images: string[];
  onRestart: () => void; // This is now "Finish Session"
  onBack: () => void;
  template: Template;
  onSaveHistory: (imageDataUrl: string) => void;
  event: Event | null;
  currentTake: number;
  maxTakes: number;
  onNextTake: () => void;
  isDownloadButtonEnabled: boolean;
  isAutoDownloadEnabled: boolean;
  printSettings: PrintSettings;
  onSaveWhatsapp?: (number: string) => void;
  currentPaymentId?: string | null;
  savedWhatsappNumber?: string;
  selectedFilter?: string; // New Prop for Filter
}

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (copies: number) => void;
  imageSrc: string | null;
  settings: PrintSettings;
}

interface WhatsappModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (number: string) => void;
}

const WhatsappModal: React.FC<WhatsappModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [number, setNumber] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (number.trim()) {
            onSubmit(number.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-sm border border-[var(--color-border-primary)]" onClick={e => e.stopPropagation()}>
                <h2 className="font-bebas text-3xl text-center mb-2">Kirim ke WhatsApp</h2>
                <p className="text-center text-[var(--color-text-muted)] text-sm mb-4">Masukkan nomor WA kamu agar admin bisa mengirimkan softfile foto.</p>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="tel" 
                        value={number} 
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-3 px-4 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#25D366] mb-4 text-center text-xl font-bold"
                        autoFocus
                    />
                    <div className="flex flex-col gap-2">
                        <button type="submit" className="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-3 px-4 rounded-full text-lg shadow-lg">
                            Kirim Nomor
                        </button>
                        <button type="button" onClick={onClose} className="w-full bg-transparent hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] font-bold py-2 rounded-full text-sm">
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, onConfirm, imageSrc, settings }) => {
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    // Reset copies when modal opens
    if (isOpen) {
      setCopies(1);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const increment = () => setCopies(c => Math.min(settings.maxCopies, c + 1));
  const decrement = () => setCopies(c => Math.max(1, c - 1));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-md border border-[var(--color-border-primary)]" onClick={e => e.stopPropagation()}>
        <h2 className="font-bebas text-3xl text-center mb-4">Konfirmasi Cetak</h2>
        <img src={imageSrc ?? ''} alt="Pratinjau Cetak" className="w-full max-w-xs mx-auto aspect-[2/3] object-contain rounded-md bg-white/10" />
        
        {settings.isCopyInputEnabled && (
          <div className="my-6">
            <label className="block text-center font-bold text-lg text-[var(--color-text-secondary)] mb-2">Jumlah Salinan</label>
            <div className="flex items-center justify-center gap-4">
              <button onClick={decrement} className="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-full text-3xl font-bold hover:bg-[var(--color-border-secondary)]">-</button>
              <span className="text-4xl font-bold w-20 text-center">{copies}</span>
              <button onClick={increment} className="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-full text-3xl font-bold hover:bg-[var(--color-border-secondary)]">+</button>
            </div>
            <p className="text-xs text-center text-[var(--color-text-muted)] mt-2">Maksimum: {settings.maxCopies} salinan. Harap sesuaikan jumlah ini di dialog cetak printer Anda.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-[var(--color-border-primary)]">
          <button onClick={() => onConfirm(copies)} className="flex-1 w-full bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-4 rounded-full text-lg">
            Konfirmasi Cetak
          </button>
          <button onClick={onClose} className="flex-1 w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function that prioritizes cache and caches on miss
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
        resolve(img);
    };
    img.onerror = (e) => reject(new Error(`Gagal memuat gambar dari src: ${src.substring(0, 100)}...`));

    // 1. Langsung muat jika ini adalah URL data (misalnya, foto yang baru diambil)
    if (src.startsWith('data:')) {
      img.src = src;
      return;
    }

    try {
      // 2. Coba muat dari cache IndexedDB
      const cachedBlob = await getCachedImage(src);
      if (cachedBlob) {
        img.src = URL.createObjectURL(cachedBlob);
        return;
      }

      // 3. Fallback: ambil dari jaringan jika tidak ada di cache
      let fetchUrl = src;
      if (src.startsWith('http')) {
          fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
      }
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil gambar. Status: ${response.status}`);
      }
      const networkBlob = await response.blob();
      
      // 4. Simpan blob yang baru diambil di cache
      await storeImageInCache(src, networkBlob);
      
      // 5. Muat gambar dari blob yang baru diambil
      img.src = URL.createObjectURL(networkBlob);

    } catch (error) {
      reject(error);
    }
  });
};


const PreviewScreen: React.FC<PreviewScreenProps> = ({ 
    images, onRestart, onBack, template, onSaveHistory, event,
    currentTake, maxTakes, onNextTake, isDownloadButtonEnabled, isAutoDownloadEnabled, printSettings, onSaveWhatsapp, currentPaymentId, savedWhatsappNumber, selectedFilter
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageRef = useRef<HTMLImageElement>(null);
  const historySavedRef = useRef(false);
  const downloadTriggeredRef = useRef(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null);

  const isLastTake = currentTake >= maxTakes;
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  // Generate QR Code if enabled and value exists
  useEffect(() => {
    if (event?.isQrCodeEnabled && event.qrCodeValue && typeof QRCode !== 'undefined') {
        try {
            QRCode.toDataURL(event.qrCodeValue, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err: any, url: string) => {
                if (!err) setGeneratedQrUrl(url);
            });
        } catch (e) {
            console.error("Error generating QR", e);
        }
    } else {
        setGeneratedQrUrl(null);
    }
  }, [event]);

  const handleDownload = useCallback((imageDataUrl?: string) => {
    const url = imageDataUrl || canvasRef.current?.toDataURL('image/png');
    if (url) {
      const link = document.createElement('a');
      link.download = `sans-photo-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, []);

  const handlePrint = useCallback(() => {
    const imageDataUrl = finalImageRef.current?.src;
    if (!imageDataUrl) {
      setErrorMsg("Gambar pratinjau tidak tersedia untuk dicetak.");
      return;
    }

    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden'; // Use visibility hidden to allow rendering but keep hidden
    document.body.appendChild(iframe);
    
    let pageSizeCss = '';
    switch (printSettings.paperSize) {
        case 'A4_portrait':
            pageSizeCss = 'size: A4 portrait;';
            break;
        case 'A4_landscape':
            pageSizeCss = 'size: A4 landscape;';
            break;
        case '4x6':
        default:
            pageSizeCss = 'size: 4in 6in;';
            break;
    }

    const grayscaleCss = printSettings.colorMode === 'grayscale' ? 'filter: grayscale(100%);' : '';
    const isLandscapeTemplate = template.orientation === 'landscape';
    
    // Logic for rotation
    const bodyStyles = `
        margin: 0; 
        padding: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        overflow: hidden;
    `;
    let imageStyles = `
        ${grayscaleCss}
        box-sizing: border-box;
    `;

    // If template is landscape, rotate image and adjust fit
    if (isLandscapeTemplate) {
        imageStyles += `
            transform: rotate(90deg);
            max-width: 100vh;
            max-height: 100vw;
            width: auto;
            height: auto;
        `;
    } else {
        // For portrait
        imageStyles += `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        `;
    }

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
            <html>
                <head>
                    <title>Print SANS PHOTO</title>
                    <style>
                        @page { 
                            ${pageSizeCss}
                            margin: 0; 
                        }
                        body { 
                            ${bodyStyles}
                        }
                        img { 
                            ${imageStyles}
                        }
                    </style>
                </head>
                <body>
                    <img src="${imageDataUrl}" id="printImage" />
                    <script>
                        // Wait for image to load before printing
                        const img = document.getElementById('printImage');
                        
                        function triggerPrint() {
                            // Focus is required for silent printing in some browsers
                            window.focus();
                            window.print();
                        }

                        if (img.complete) {
                            setTimeout(triggerPrint, 100);
                        } else {
                            img.onload = function() {
                                setTimeout(triggerPrint, 100);
                            };
                        }
                    </script>
                </body>
            </html>
        `);
        iframeDoc.close();
        
        // Focus the iframe from parent to ensure print dialog appears for it
        iframe.contentWindow?.focus();
    }

    // Cleanup iframe after a delay
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 60000); 

    setIsPrintModalOpen(false);
  }, [printSettings, template]);

  const handleWhatsappSubmit = (number: string) => {
      if (onSaveWhatsapp) {
          onSaveWhatsapp(number);
      }
  };

  const drawCanvas = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) {
        setErrorMsg("Tidak ada gambar yang diambil.");
        setIsLoading(false);
        return;
    }

    // Fix Chrome Android Aw Snap
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        setErrorMsg("Tidak dapat memperoleh konteks kanvas.");
        setIsLoading(false);
        return;
    }
      
    const canvasWidth = TEMPLATE_WIDTH;
    const canvasHeight = TEMPLATE_HEIGHT;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,canvas.width, canvas.height);

      const imagePromises: Promise<HTMLImageElement>[] = [
        loadImage(template.imageUrl), 
        ...images.map(src => loadImage(src))
      ];

      const [templateImg, ...loadedImages] = await Promise.all(imagePromises);

      // Gambar foto yang diambil dan pangkas agar sesuai dengan slot
      template.photoSlots.forEach(slot => {
        const img = loadedImages[slot.inputId - 1];
        if (!img) return;
        
        ctx.save();
        
        // Apply Filter to Photo (if supported by browser canvas ctx)
        if (selectedFilter && selectedFilter !== 'none') {
            ctx.filter = selectedFilter;
        }

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
        
        const slotCenterX = slot.x + slot.width / 2;
        const slotCenterY = slot.y + slot.height / 2;
        const rotationDegrees = slot.rotation || 0;

        ctx.translate(slotCenterX, slotCenterY);
        if (rotationDegrees !== 0) {
            ctx.rotate(rotationDegrees * Math.PI / 180);
        }
        ctx.scale(-1, 1);

        ctx.drawImage(
            img,
            sx, sy, sWidth, sHeight,
            -slot.width / 2, -slot.height / 2, slot.width, slot.height
        );
        
        ctx.restore();
      });

      // Gambar templat di atasnya (No Filter)
      ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
      
      const finalImageDataUrl = canvas.toDataURL('image/png');

      if(finalImageRef.current) {
          finalImageRef.current.src = finalImageDataUrl;
      }
      
      if (onSaveHistory && !historySavedRef.current) {
          onSaveHistory(finalImageDataUrl);
          historySavedRef.current = true;
      }

      if (isAutoDownloadEnabled && !downloadTriggeredRef.current) {
          handleDownload(finalImageDataUrl);
          downloadTriggeredRef.current = true;
      }
      
      // Cleanup memory
      setTimeout(() => {
          if (canvas) {
              canvas.width = 1;
              canvas.height = 1;
          }
      }, 100);

      setIsLoading(false);

    } catch (error) {
      console.error("Kesalahan saat menggambar kanvas:", error);
      setErrorMsg("Tidak dapat menghasilkan gambar akhir. Templat mungkin tidak tersedia atau ada masalah jaringan.");
      setIsLoading(false);
    }
  }, [images, template, onSaveHistory, handleDownload, TEMPLATE_WIDTH, TEMPLATE_HEIGHT, isAutoDownloadEnabled, selectedFilter]);

  useEffect(() => {
    // Reset refs for each new preview
    historySavedRef.current = false;
    downloadTriggeredRef.current = false;
    drawCanvas();
  }, [drawCanvas]);

  return (
    <>
    <PrintModal 
      isOpen={isPrintModalOpen}
      onClose={() => setIsPrintModalOpen(false)}
      onConfirm={handlePrint}
      imageSrc={finalImageRef.current?.src ?? null}
      settings={printSettings}
    />
    <WhatsappModal 
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        onSubmit={handleWhatsappSubmit}
    />
    <div className="relative flex flex-col items-center justify-center h-full w-full">
       <div className="absolute top-4 left-4">
        <button 
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Kembali"
        >
          <BackIcon />
        </button>
      </div>
      <h2 className="font-bebas text-4xl mb-4">Ini Foto Anda! (Pengambilan {currentTake}/{maxTakes})</h2>
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8">
    
        {/* Kolom Foto - DIBUAT LEBIH BESAR */}
        <div className={`relative w-full max-w-lg ${isLandscape ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <svg className="animate-spin h-12 w-12 text-[var(--color-text-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-[var(--color-text-secondary)]">Membuat karya agung Anda...</p>
                </div>
            )}
            {errorMsg && (
                <div className="absolute inset-0 bg-red-900/30 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <p className="font-bold text-red-300">Oops! Terjadi kesalahan.</p>
                    <p className="text-sm text-red-200 mt-2">{errorMsg}</p>
                    <button
                        onClick={drawCanvas}
                        className="mt-4 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-2 px-4 rounded-full text-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}
            <img ref={finalImageRef} alt="Gambar photobooth akhir Anda" className={`w-full h-full object-contain rounded-lg shadow-2xl shadow-[var(--color-accent-primary)]/30 ${isLoading || errorMsg ? 'hidden' : 'block'}`} />
        </div>
        
        {/* Kolom Aksi & QR */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            {isLastTake ? (
                <button
                    onClick={onRestart}
                    disabled={isLoading || !!errorMsg}
                    className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait"
                >
                  <CheckIcon />
                  <span>Selesai</span>
                </button>
            ) : (
                <button
                    onClick={onNextTake}
                    disabled={isLoading || !!errorMsg}
                    className="w-full bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait"
                >
                    <RestartIcon />
                    Mulai Pengambilan Berikutnya
                </button>
            )}
            
            <div className="w-full flex gap-4">
              {isDownloadButtonEnabled && (
                <button
                  onClick={() => handleDownload()}
                  disabled={isLoading || !!errorMsg}
                  className="w-full flex-1 bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:transform-none"
                >
                  <DownloadIcon />
                  Unduh
                </button>
              )}

              {printSettings.isEnabled && (
                 <button
                  onClick={() => setIsPrintModalOpen(true)}
                  disabled={isLoading || !!errorMsg}
                  className="w-full flex-1 bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:transform-none"
                >
                  <PrintIcon />
                  Cetak
                </button>
              )}
            </div>

            {/* WhatsApp Button (Only shown if Payment ID exists) */}
            {currentPaymentId && (
                <button
                    onClick={() => setIsWhatsappModalOpen(true)}
                    disabled={isLoading || !!errorMsg || !!savedWhatsappNumber}
                    className={`w-full font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg ${savedWhatsappNumber ? 'bg-gray-600 cursor-default transform-none' : 'bg-[#25D366] hover:bg-[#20b858] text-white'}`}
                >
                    <WhatsAppIcon />
                    <span>{savedWhatsappNumber ? 'Terkirim ke Admin' : 'Kirim ke WhatsApp'}</span>
                </button>
            )}

            {event?.isQrCodeEnabled && generatedQrUrl && (
                <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">Pindai untuk tautan cepat</p>
                    <img src={generatedQrUrl} alt="Kode QR" className="w-64 h-64 mx-auto rounded-md border-4 border-white" />
                </div>
            )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
    </>
  );
};

export default PreviewScreen;
