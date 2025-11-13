import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { Template } from '../types';

interface CaptureScreenProps {
  onComplete: (images: string[]) => void;
  template: Template;
  countdownDuration: number;
  flashEffectEnabled: boolean;
}

const TEMPLATE_WIDTH = 1200;
const TEMPLATE_HEIGHT = 1800;

const getProxiedUrl = (url: string) => {
    if (!url || !url.startsWith('http')) {
        return url;
    }
    // Gunakan api.allorigins.win untuk melewati masalah CORS.
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
};

const CaptureScreen: React.FC<CaptureScreenProps> = ({ onComplete, template, countdownDuration, flashEffectEnabled }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalPhotos = useMemo(() => [...new Set(template.photoSlots.map(slot => slot.inputId))].length, [template.photoSlots]);

  const aspectRatio = useMemo(() => {
    const currentInputId = photoIndex + 1;
    const slotForCurrentPhoto = template.photoSlots.find(slot => slot.inputId === currentInputId);
    if (slotForCurrentPhoto && slotForCurrentPhoto.height > 0) {
      return `${slotForCurrentPhoto.width} / ${slotForCurrentPhoto.height}`;
    }
    return '16 / 9'; 
  }, [photoIndex, template.photoSlots]);

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
        const newImages = [...images, dataUrl];
        setImages(newImages);
        
        if (newImages.length === totalPhotos) {
          onComplete(newImages);
        } else {
          setPhotoIndex(photoIndex + 1);
        }
      }
    }
  }, [images, onComplete, photoIndex, totalPhotos]);

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
      <div className="flex flex-col md:flex-row w-full gap-8 items-center h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)]">
          
        {/* Left Column: Full height flex column */}
        <div className="w-full md:w-3/5 h-full flex flex-col items-center">
          <div className="w-full flex-grow flex items-center justify-center min-h-0 py-4">
            <div 
              className="relative h-full bg-black rounded-lg overflow-hidden border-4 border-gray-700 shadow-2xl shadow-purple-500/20 transition-all duration-300 ease-in-out"
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
          <div className="py-4 w-full max-w-md shrink-0">
              {countdown === null && !isSessionFinished ? (
                <button
                  onClick={startCountdown}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <CameraIcon />
                  Take Photo {photoIndex + 1}
                </button>
              ) : (
                <div className="text-center text-lg h-[64px] flex items-center justify-center">
                  {isSessionFinished ? 'All photos taken!' : 'Get ready...'}
                </div>
              )}
            </div>
        </div>

        {/* Right Column: Full height flex column */}
        <div className="w-full md:w-2/5 h-full flex flex-col items-center justify-center">
          <h2 className="font-bebas text-4xl mb-4 shrink-0">PHOTO {Math.min(photoIndex + 1, totalPhotos)} / {totalPhotos}</h2>
          <div className="relative w-auto max-h-full aspect-[2/3] bg-white rounded-lg overflow-hidden shadow-lg">
            {images.map((imgSrc, index) => {
                const inputId = index + 1;
                return template.photoSlots.filter(slot => slot.inputId === inputId).map(slot => (
                    <img
                        key={`captured-${slot.id}`}
                        src={imgSrc}
                        alt={`Captured photo ${inputId}`}
                        className="absolute object-cover transform -scale-x-100"
                        style={{
                            left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                            top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                            width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                            height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                        }}
                    />
                ));
            })}
            <img src={getProxiedUrl(template.imageUrl)} alt="Template" className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </>
  );
};

export default CaptureScreen;