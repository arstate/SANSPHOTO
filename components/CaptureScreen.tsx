
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { Template } from '../types';

interface CaptureScreenProps {
  onCaptureComplete: (images: string[]) => void;
  onRetakeComplete: (image: string) => void;
  retakeForIndex: number | null; // index in the capturedImages array
  template: Template;
  countdownDuration: number;
  flashEffectEnabled: boolean;
  onProgressUpdate?: (current: number, total: number) => void;
  existingImages?: string[];
  cameraSourceType?: 'default' | 'ip_camera';
  cameraDeviceId?: string;
  ipCameraUrl?: string;
  ipCameraUseProxy?: boolean;
}

const CaptureScreen: React.FC<CaptureScreenProps> = ({ 
  onCaptureComplete, onRetakeComplete, retakeForIndex, template, countdownDuration, flashEffectEnabled, onProgressUpdate, existingImages,
  cameraSourceType = 'default', cameraDeviceId, ipCameraUrl, ipCameraUseProxy
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ipCamImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRetakeMode = retakeForIndex !== null;
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;
  
  const isIpCamera = cameraSourceType === 'ip_camera' && !!ipCameraUrl;

  const totalPhotos = useMemo(() => isRetakeMode ? 1 : [...new Set(template.photoSlots.map(slot => slot.inputId))].length, [template.photoSlots, isRetakeMode]);

  // Update progress whenever photoIndex changes
  useEffect(() => {
    if (!isRetakeMode) {
      onProgressUpdate?.(photoIndex + 1, totalPhotos);
    }
  }, [photoIndex, totalPhotos, onProgressUpdate, isRetakeMode]);

  const aspectRatio = useMemo(() => {
    // Untuk retake, retakeForIndex adalah indeks berbasis 0. inputId berbasis 1.
    const currentInputId = isRetakeMode ? (retakeForIndex ?? 0) + 1 : photoIndex + 1;
    const slotForCurrentPhoto = template.photoSlots.find(slot => slot.inputId === currentInputId);

    if (slotForCurrentPhoto && slotForCurrentPhoto.width > 0 && slotForCurrentPhoto.height > 0) {
        const rotation = Number(slotForCurrentPhoto.rotation || 0);
        const isRotatedSideways = Math.abs(rotation) % 180 === 90;
        
        if (isRotatedSideways) {
            return `${slotForCurrentPhoto.height} / ${slotForCurrentPhoto.width}`;
        }
        return `${slotForCurrentPhoto.width} / ${slotForCurrentPhoto.height}`;
    }
    
    return '16 / 9';
  }, [photoIndex, template.photoSlots, isRetakeMode, retakeForIndex]);

  // Proxy logic: If proxy enabled, wrap the URL
  const finalIpCameraUrl = useMemo(() => {
    if (!isIpCamera || !ipCameraUrl) return '';
    if (ipCameraUseProxy) {
        return `https://corsproxy.io/?${encodeURIComponent(ipCameraUrl)}`;
    }
    return ipCameraUrl;
  }, [isIpCamera, ipCameraUrl, ipCameraUseProxy]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (isIpCamera) {
        const img = new Image();
        img.onload = () => setCameraError(null);
        img.onerror = () => {
             console.warn("Stream might be failing to load or needs proxy.");
        };
        img.src = finalIpCameraUrl;
        return;
    }

    const setupCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = { 
            video: { 
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                ...(cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : { facingMode: 'user' })
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access the camera. Please check permissions and try again.");
      }
    };

    setupCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [isIpCamera, finalIpCameraUrl, cameraDeviceId]);

  const takePicture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. DOWNSCALE RESOLUSI (Wajib untuk Android untuk mencegah Crash OOM)
    // Batasi lebar maksimal. 1200px sudah cukup tajam untuk photobooth.
    const MAX_WIDTH = 1200; 
    let sourceWidth = 0;
    let sourceHeight = 0;
    let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;

    if (isIpCamera && ipCamImgRef.current) {
        const img = ipCamImgRef.current;
        sourceElement = img;
        sourceWidth = img.naturalWidth || 640;
        sourceHeight = img.naturalHeight || 480;
    } else if (!isIpCamera && videoRef.current) {
        const vid = videoRef.current;
        sourceElement = vid;
        sourceWidth = vid.videoWidth;
        sourceHeight = vid.videoHeight;
    }

    if (!sourceElement || sourceWidth === 0 || sourceHeight === 0) return;

    // Hitung rasio baru
    let drawWidth = sourceWidth;
    let drawHeight = sourceHeight;

    if (drawWidth > MAX_WIDTH) {
        const ratio = MAX_WIDTH / drawWidth;
        drawWidth = MAX_WIDTH;
        drawHeight = drawHeight * ratio;
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    // 2. MANTRA ANTI-CRASH CHROME: willReadFrequently: true
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (context) {
        try {
            // --- LANGKAH A: GAMBAR DASAR ---
            context.drawImage(sourceElement, 0, 0, drawWidth, drawHeight);

            // --- LANGKAH B: EFEK BEAUTY RINGAN (GPU BLENDING) ---
            // Mencerahkan sedikit tanpa manipulasi pixel berat
            context.save();
            context.globalCompositeOperation = "screen"; // atau 'soft-light'
            context.globalAlpha = 0.2; // 20% pencerahan (subtle beauty)
            context.drawImage(sourceElement, 0, 0, drawWidth, drawHeight);
            context.restore();

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // --- LANGKAH C: BERSIHKAN MEMORI ---
            // Paksa browser membuang sampah memori segera dengan mengecilkan canvas
            setTimeout(() => {
                if (canvas) {
                    canvas.width = 1;
                    canvas.height = 1;
                }
            }, 100);

            if (isRetakeMode) {
                onRetakeComplete(dataUrl);
                return; 
            }

            const newImages = [...images, dataUrl];
            setImages(newImages);
            
            if (newImages.length === totalPhotos) {
              onCaptureComplete(newImages);
            } else {
              setPhotoIndex(photoIndex + 1);
            }

        } catch (e) {
            console.error("Canvas tainted or error", e);
            setCameraError("Capture Error: Please check camera permissions or CORS settings.");
        }
    }
  }, [images, onCaptureComplete, onRetakeComplete, photoIndex, totalPhotos, isRetakeMode, isIpCamera]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const captureMoment = () => {
        if (flashEffectEnabled) {
          setShowFlash(true);
          setTimeout(() => {
            takePicture();
            setTimeout(() => setShowFlash(false), 100);
          }, 50);
        } else {
          takePicture();
        }
        setCountdown(null);
      };
      captureMoment();
    }
  }, [countdown, flashEffectEnabled, takePicture]);

  const startCountdown = () => {
    setCountdown(countdownDuration);
  };
  
  if (cameraError) {
    return (
        <div className="text-center p-8 bg-red-900/50 rounded-lg h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-red-300">Camera Error</h2>
            <p className="mt-2 text-red-200">{cameraError}</p>
             {isIpCamera && (
                <div className="mt-4 text-sm text-red-300 bg-black/30 p-2 rounded break-all max-w-md">
                    <p>URL: {finalIpCameraUrl}</p>
                    {ipCameraUseProxy && <p className="text-xs text-yellow-300 mt-1">(Proxy Enabled)</p>}
                </div>
            )}
        </div>
    );
  }
  
  const isSessionFinished = photoIndex >= totalPhotos;

  return (
    <>
      {showFlash && <div className="fixed inset-0 bg-white z-50"></div>}
      <div className="flex flex-col md:flex-row w-full h-full gap-8 items-stretch">
          
        {/* Left Column: Main Camera Preview */}
        <div className="w-full md:w-3/5 flex flex-col items-center justify-center p-4 md:p-2">
          <div className="w-full flex-grow flex items-center justify-center min-h-0">
            <div 
              className="relative max-w-full max-h-full bg-black rounded-lg overflow-hidden border-4 border-[var(--color-border-primary)] shadow-2xl shadow-[var(--color-accent-primary)]/20"
              style={{ aspectRatio: aspectRatio }}
            >
              {isIpCamera ? (
                 <img
                    ref={ipCamImgRef}
                    src={finalIpCameraUrl}
                    crossOrigin="anonymous"
                    alt="IP Camera Stream"
                    className="w-full h-full object-cover transform -scale-x-100"
                 />
              ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                />
              )}
                {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                  <div className="text-9xl font-bebas text-white animate-ping">{countdown > 0 ? countdown : ''}</div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-6 w-full max-w-md shrink-0">
              {countdown === null && !isSessionFinished ? (
                <button
                  onClick={startCountdown}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <CameraIcon />
                  {isRetakeMode ? 'Take Retake' : `Take Photo ${photoIndex + 1}`}
                </button>
              ) : (
                <div className="text-center text-lg h-[64px] flex items-center justify-center">
                  {isSessionFinished ? 'All photos taken!' : 'Get ready...'}
                </div>
              )}
            </div>
        </div>

        {/* Right Column: Live Template Preview */}
        <div className="w-full md:w-2/5 flex flex-col items-center p-4 md:p-2">
          <h2 className="font-bebas text-4xl mb-4 shrink-0">
            {isRetakeMode ? `RETAKE PHOTO` : `PHOTO ${Math.min(photoIndex + 1, totalPhotos)} / ${totalPhotos}`}
          </h2>
          <div className="w-full flex-grow flex items-center justify-center min-h-0">
            <div className={`relative w-full h-auto ${isLandscape ? 'aspect-[3/2]' : 'aspect-[2/3]'} bg-white rounded-lg overflow-hidden shadow-lg`}>
                
                {isRetakeMode && existingImages ? (
                    existingImages.map((imgSrc, index) => {
                        // In retake mode, skip the one being retaken to leave its slot "empty"
                        if (index === retakeForIndex) {
                            return null;
                        }
                        const inputId = index + 1;
                        return template.photoSlots.filter(slot => slot.inputId === inputId).map(slot => (
                            <img
                                key={`existing-${slot.id}`}
                                src={imgSrc}
                                alt={`Previously captured photo ${inputId}`}
                                className="absolute object-cover"
                                style={{
                                    left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                                    top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                                    width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                                    height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                                    transform: `rotate(${slot.rotation || 0}deg) scaleX(-1)`,
                                }}
                            />
                        ));
                    })
                ) : (
                    images.map((imgSrc, index) => {
                        const inputId = index + 1;
                        return template.photoSlots.filter(slot => slot.inputId === inputId).map(slot => (
                            <img
                                key={`captured-${slot.id}`}
                                src={imgSrc}
                                alt={`Captured photo ${inputId}`}
                                className="absolute object-cover"
                                style={{
                                    left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                                    top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                                    width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                                    height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                                    transform: `rotate(${slot.rotation || 0}deg) scaleX(-1)`,
                                }}
                            />
                        ));
                    })
                )}
                
                <img src={template.imageUrl} alt="Template" className="absolute inset-0 w-full h-full pointer-events-none" />
            </div>
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </>
  );
};

export default CaptureScreen;
