

import React, { useRef, useState, useEffect } from 'react';
import { PaymentEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { CameraIcon } from './icons/CameraIcon';
import { CheckIcon } from './icons/CheckIcon';

declare const Tesseract: any;

interface PaymentVerificationScreenProps {
  payment: PaymentEntry | null;
  onScanSuccess: (proofImageUrl: string, imageHash: string) => void;
  onBack: () => void;
}

// Simple hash function for image data
const generateImageHash = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const PaymentVerificationScreen: React.FC<PaymentVerificationScreenProps> = ({ payment, onScanSuccess, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" } 
            });
            streamRef.current = stream;
            
            // Assign stream to video if ref exists (initial load)
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };
    
    startCamera();
    
    // Cleanup on unmount
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };
  }, []);

  // Re-attach stream when we go back to camera mode (capturedImage is null)
  useEffect(() => {
    if (!capturedImage && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }
  }, [capturedImage]);

  const handleCaptureAndScan = async () => {
      if (!videoRef.current || !canvasRef.current || !payment) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw image
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      
      setScanning(true);
      setScanStatus('scanning');
      
      // OCR Scan Logic
      try {
          if (typeof Tesseract === 'undefined') {
              throw new Error("Tesseract library not loaded.");
          }
          
          const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
          
          const cleanText = text.replace(/[^0-9]/g, '');
          const targetAmountStr = payment.amount.toString();
          
          console.log("OCR Result:", cleanText);
          
          // Generate Hash for double-spend protection
          // We take a substring to make hashing faster, or hash the whole thing if performance allows
          // Using a substring of the base64 is usually unique enough for this purpose
          const imageHash = generateImageHash(dataUrl.substring(dataUrl.length - 2000));

          if (cleanText.includes(targetAmountStr)) {
              setScanStatus('success');
              setTimeout(() => {
                  onScanSuccess(dataUrl, imageHash);
              }, 1500);
          } else {
              setScanStatus('failed');
          }
      } catch (e) {
          console.error("OCR Error", e);
          setScanStatus('failed');
      } finally {
          setScanning(false);
      }
  };
  
  const handleRetake = () => {
      setCapturedImage(null);
      setScanStatus('idle');
  };
  
  const handleManualProceed = () => {
      if (capturedImage) {
          const imageHash = generateImageHash(capturedImage.substring(capturedImage.length - 2000));
          onScanSuccess(capturedImage, imageHash);
      }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 bg-black">
       <div className="absolute top-4 left-4 z-20">
        <button onClick={onBack} className="bg-white/20 hover:bg-white/40 text-white font-bold p-3 rounded-full transition-colors">
            <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
          <h2 className="text-white text-2xl font-bold mb-4 z-10">Scan Bukti Pembayaran</h2>
          <p className="text-gray-300 text-sm mb-4 text-center z-10">
              Arahkan bukti pembayaran ke kamera. Pastikan nominal <b>Rp {payment?.amount.toLocaleString()}</b> terlihat jelas.
          </p>
          
          <div className="relative w-full aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden border-4 border-white/20">
              {/* Conditional rendering for Video vs Image */}
              {!capturedImage ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
              ) : (
                  <img src={capturedImage} alt="Captured Proof" className="w-full h-full object-cover" />
              )}
              
              {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-t-[var(--color-accent-primary)] border-white/30 rounded-full animate-spin mb-4"></div>
                      <p className="text-white font-bold animate-pulse">Scanning...</p>
                  </div>
              )}
              
              {scanStatus === 'success' && (
                  <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center animate-fade-in">
                      <div className="bg-white text-green-600 rounded-full p-4 mb-2"><CheckIcon /></div>
                      <p className="text-white font-bold text-2xl">Pembayaran Diterima!</p>
                  </div>
              )}

              {/* Scanning Overlay Guide */}
              {!capturedImage && (
                  <div className="absolute inset-0 border-2 border-white/30 p-8 pointer-events-none">
                      <div className="w-full h-1/3 mt-24 border-2 border-[var(--color-accent-primary)] rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.5)]"></div>
                      <p className="text-center text-white/70 text-xs mt-2">Posisikan nominal di kotak ini</p>
                  </div>
              )}
          </div>
          
          <div className="mt-6 w-full flex flex-col gap-3">
              {scanStatus === 'idle' && (
                  <button 
                    onClick={handleCaptureAndScan}
                    disabled={!cameraActive}
                    className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-4 rounded-full text-xl flex items-center justify-center gap-2"
                  >
                      <CameraIcon /> Ambil & Scan
                  </button>
              )}
              
              {scanStatus === 'failed' && (
                  <div className="w-full bg-red-900/80 p-4 rounded-lg text-center">
                      <p className="text-white mb-3">Tidak dapat membaca nominal. Pastikan foto jelas.</p>
                      <div className="flex gap-2">
                        <button 
                            onClick={handleRetake}
                            className="flex-1 bg-white text-red-900 font-bold py-3 rounded-lg hover:bg-gray-100"
                        >
                            Coba Lagi
                        </button>
                        <button 
                            onClick={handleManualProceed}
                            className="flex-1 bg-[var(--color-positive)] text-white font-bold py-3 rounded-lg hover:brightness-110"
                        >
                            Foto Sudah Benar
                        </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default PaymentVerificationScreen;