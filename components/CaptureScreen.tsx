
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Template } from '../types';

interface CaptureScreenProps {
  onComplete: (images: string[]) => void;
  template: Template;
  countdownDuration: number;
  flashEffectEnabled: boolean;
}

const CaptureScreen: React.FC<CaptureScreenProps> = ({ onComplete, template, countdownDuration, flashEffectEnabled }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalPhotos = useMemo(() => [...new Set(template.photoSlots.map(slot => slot.inputId))].length, [template.photoSlots]);

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
        setCameraError("Tidak dapat mengakses kamera. Silakan periksa izin dan coba lagi.");
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
            <h2 className="text-2xl font-bold text-red-300">Kesalahan Kamera</h2>
            <p className="mt-2 text-red-200">{cameraError}</p>
        </div>
    );
  }
  
  const isSessionFinished = photoIndex >= totalPhotos;

  return (
    <>
      {showFlash && <div className="fixed inset-0 bg-white z-50"></div>}
      <div className="flex flex-col w-full h-full items-center justify-center">
          <div 
            className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden border-4 border-[var(--color-border-primary)] shadow-2xl"
            style={{ aspectRatio: '16/9' }}
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
          <div className="mt-6 w-full max-w-md">
              {countdown === null && !isSessionFinished ? (
                <button
                  onClick={startCountdown}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-transform transform hover:scale-105"
                >
                  Ambil Foto {photoIndex + 1} / {totalPhotos}
                </button>
              ) : (
                <div className="text-center text-lg h-[64px] flex items-center justify-center text-[var(--color-text-secondary)]">
                  {isSessionFinished ? 'Semua foto telah diambil!' : 'Bersiap...'}
                </div>
              )}
            </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </>
  );
};

export default CaptureScreen;
