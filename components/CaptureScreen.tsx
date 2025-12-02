
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
        // Memastikan rotasi adalah angka
        const rotation = Number(slotForCurrentPhoto.rotation || 0);
        
        // Untuk rotasi 90 atau 270 derajat, lebar dan tinggi visual ditukar.
        // Logika ini menyesuaikan rasio aspek pratinjau kamera agar sesuai dengan slot yang diputar.
        const isRotatedSideways = Math.abs(rotation) % 180 === 90;
        
        if (isRotatedSideways) {
            // Gunakan tinggi/lebar untuk slot yang diputar ke samping
            return `${slotForCurrentPhoto.height} / ${slotForCurrentPhoto.width}`;
        }
        // Gunakan lebar/tinggi untuk slot tegak atau terbalik
        return `${slotForCurrentPhoto.width} / ${slotForCurrentPhoto.height}`;
    }
    
    // Fallback jika slot tidak ditemukan
    return '16 / 9';
  }, [photoIndex, template.photoSlots, isRetakeMode, retakeForIndex]);

  // Proxy logic: If proxy enabled, wrap the URL
  const finalIpCameraUrl = useMemo(() => {
    if (!isIpCamera || !ipCameraUrl) return '';
    if (ipCameraUseProxy) {
        // Use a standard CORS proxy wrapper. 
        // corsproxy.io is a common public one. 
        // Alternatives: 'https://api.allorigins.win/raw?url=' or self-hosted.
        return `https://corsproxy.io/?${encodeURIComponent(ipCameraUrl)}`;
    }
    return ipCameraUrl;
  }, [isIpCamera, ipCameraUrl, ipCameraUseProxy]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (isIpCamera) {
        // For IP Camera, we just rely on the <img src> tag.
        // We can optionally check if the image loads.
        const img = new Image();
        img.onload = () => setCameraError(null);
        img.onerror = () => {
             // Don't set error immediately on first load fail for streams, sometimes it takes a moment
             // But we can log it.
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
                // If a specific device ID is selected (e.g., external USB), use it.
                // Otherwise default to user facing camera.
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
    
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        if (isIpCamera && ipCamImgRef.current) {
            const img = ipCamImgRef.current;
            // Ensure we draw the natural size of the image
            canvas.width = img.naturalWidth || 640;
            canvas.height = img.naturalHeight || 480;
            
            // Try/Catch block for tainted canvas issues (CORS)
            try {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                console.error("Canvas tainted by cross-origin data", e);
                setCameraError("Security Error: Unable to capture image due to CORS. Please enable the Proxy setting in Admin > Camera Source.");
                return;
            }
        } else if (!isIpCamera && videoRef.current) {
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        } else {
            return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg');
        
        if (isRetakeMode) {
            onRetakeComplete(dataUrl);
            return; // End here for retake
        }

        const newImages = [...images, dataUrl];
        setImages(newImages);
        
        if (newImages.length === totalPhotos) {
          onCaptureComplete(newImages);
        } else {
          setPhotoIndex(photoIndex + 1);
        }
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
        <div className="text-center p-8 bg-red-900/50 rounded-none h-full flex flex-col items-center justify-center border-4 border-red-500">
            <h2 className="text-2xl font-bold text-red-300 uppercase">Camera Error</h2>
            <p className="mt-2 text-red-200">{cameraError}</p>
             {isIpCamera && (
                <div className="mt-4 text-sm text-red-300 bg-black/30 p-2 rounded-none break-all max-w-md border border-red-500">
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
              className="relative max-w-full max-h-full bg-black rounded-none overflow-hidden border-4 border-[var(--color-border-primary)] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
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
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-none border-4 border-black text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase"
                >
                  <CameraIcon />
                  {isRetakeMode ? 'Take Retake' : `Take Photo ${photoIndex + 1}`}
                </button>
              ) : (
                <div className="text-center text-lg h-[64px] flex items-center justify-center font-bold uppercase tracking-wider bg-black text-white border-2 border-white">
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
            <div className={`relative w-full h-auto ${isLandscape ? 'aspect-[3/2]' : 'aspect-[2/3]'} bg-white rounded-none overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black`}>
                
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
