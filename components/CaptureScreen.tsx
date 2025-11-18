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
}

const CaptureScreen: React.FC<CaptureScreenProps> = ({ 
  onCaptureComplete, onRetakeComplete, retakeForIndex, template, countdownDuration, flashEffectEnabled, onProgressUpdate, existingImages
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRetakeMode = retakeForIndex !== null;
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  const totalPhotos = useMemo(() => isRetakeMode ? 1 : [...new Set(template.photoSlots.map(slot => slot.inputId))].length, [template.photoSlots, isRetakeMode]);

  // Update progress whenever photoIndex changes
  useEffect(() => {
    if (!isRetakeMode) {
      onProgressUpdate?.(photoIndex + 1, totalPhotos);
    }
  }, [photoIndex, totalPhotos, onProgressUpdate, isRetakeMode]);

  const aspectRatio = useMemo(() => {
    // For retakes, retakeForIndex is the 0-based index. inputId is 1-based.
    const currentInputId = isRetakeMode ? (retakeForIndex ?? 0) + 1 : photoIndex + 1;
    const slotForCurrentPhoto = template.photoSlots.find(slot => slot.inputId === currentInputId);

    if (slotForCurrentPhoto && slotForCurrentPhoto.width > 0 && slotForCurrentPhoto.height > 0) {
        const rotation = slotForCurrentPhoto.rotation || 0;
        
        // For rotations of 90 or 270 degrees, the effective width and height are swapped.
        // This ensures the camera preview's aspect ratio matches the visual orientation of the slot.
        // A modulo check handles various rotation values like -90, 270, 450, etc.
        const isSideways = Math.abs(rotation) % 180 !== 0;
        
        if (isSideways) {
            // Return height / width for sideways slots
            return `${slotForCurrentPhoto.height} / ${slotForCurrentPhoto.width}`;
        } else {
            // Return width / height for upright or upside-down slots
            return `${slotForCurrentPhoto.width} / ${slotForCurrentPhoto.height}`;
        }
    }
    
    // Fallback to a standard 16:9 aspect ratio if slot is not found or has no dimensions
    return '16 / 9';
  }, [photoIndex, template.photoSlots, isRetakeMode, retakeForIndex]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access the camera. Please check permissions and try again.");
      }
    };

    setupCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takePicture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
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
  }, [images, onCaptureComplete, onRetakeComplete, photoIndex, totalPhotos, isRetakeMode]);

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
        <div className="text-center p-8 bg-red-900/50 rounded-lg">
            <h2 className="text-2xl font-bold text-red-300">Camera Error</h2>
            <p className="mt-2 text-red-200">{cameraError}</p>
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
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
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