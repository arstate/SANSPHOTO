
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BackIcon } from './icons/BackIcon';
import { RestartIcon } from './icons/RestartIcon';

// Declare Tesseract global
declare const Tesseract: any;

interface PaymentVerificationScreenProps {
  targetAmount: number;
  onVerified: (proofHash: string) => void;
  onBack: () => void;
  validateProofHash: (hash: string) => Promise<boolean>;
}

const PaymentVerificationScreen: React.FC<PaymentVerificationScreenProps> = ({ targetAmount, onVerified, onBack, validateProofHash }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'analyzing' | 'success' | 'duplicate'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<string>('Menyiapkan kamera...');
  
  // Use a ref for processing state to avoid closure staleness in interval without re-triggering effects
  const isProcessingRef = useRef(false);
  const scanStatusRef = useRef(scanStatus); // Keep track of status in ref for interval

  // Sync ref with state
  useEffect(() => {
      scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  const stopCamera = useCallback(() => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        setStream(newStream);
        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
            // Explicitly play to avoid black screen on some devices
            try {
                await videoRef.current.play();
            } catch (e) {
                console.warn("Autoplay blocked or failed", e);
            }
        }
        setLogs('Mencari bukti pembayaran...');
    } catch (err) {
        console.error("Camera error:", err);
        setLogs("Gagal akses kamera. Izinkan akses kamera.");
    }
  }, []);

  const generateImageHash = async (base64Image: string): Promise<string> => {
      const len = base64Image.length;
      const sample = base64Image.substring(len / 2 - 20, len / 2 + 20);
      let hash = 0;
      const str = len + sample;
      for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
      }
      return hash.toString();
  };

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return;

    // CRITICAL FIX: If video is not ready, return SILENTLY.
    // Do not throw errors or update state, otherwise it flickers and resets the stream.
    if (videoRef.current.readyState !== 4 || videoRef.current.videoWidth === 0) {
        return;
    }

    isProcessingRef.current = true;
    
    try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");

        // Draw video to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed

        // 1. Check Duplication Hash
        const hash = await generateImageHash(dataUrl);
        const isDuplicate = await validateProofHash(hash);
        
        if (isDuplicate) {
            setScanStatus('duplicate');
            setLogs('Bukti sudah digunakan!');
            isProcessingRef.current = false;
            return; 
        }

        // 2. OCR Processing
        // Only update status if we weren't already analyzing to prevent jitter
        if (scanStatusRef.current !== 'analyzing') {
            setScanStatus('analyzing');
            setLogs('Menganalisa nominal...');
        }
        
        const result = await Tesseract.recognize(
            dataUrl,
            'eng',
            { logger: () => {} } // Disable logger for performance
        );

        const text = result.data.text;
        
        // Clean text
        const cleanText = text.replace(/[^0-9.,]/g, ' '); 
        const amountString = targetAmount.toLocaleString('id-ID'); // e.g. "25.000"
        const amountPlain = targetAmount.toString(); // "25000"
        const amountPlainDot = amountPlain.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); // "25.000" manual logic
        
        const found = cleanText.includes(amountString) || cleanText.includes(amountPlain) || cleanText.includes(amountPlainDot);
        
        if (found) {
            setScanStatus('success');
            stopCamera();
            setTimeout(() => onVerified(hash), 1500);
        } else {
            // Nominal not found, go back to scanning silently
            if (scanStatusRef.current !== 'success') {
                setScanStatus('scanning');
                setLogs('Nominal tidak terbaca, coba dekatkan...');
            }
        }

    } catch (err) {
        console.error(err);
        // Only reset to scanning if we hit a hard error, but try to keep camera alive
        if (scanStatusRef.current !== 'success') {
             setScanStatus('scanning');
             // Don't change logs here to avoid flicker unless critical
        }
    } finally {
        isProcessingRef.current = false;
    }
  }, [targetAmount, stopCamera, onVerified, validateProofHash]);

  // Initial Camera Start
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Continuous Scanning Loop
  useEffect(() => {
      const intervalId = setInterval(() => {
          // Check if camera is active and we are not already successful
          if (scanStatusRef.current !== 'success' && !isProcessingRef.current) {
              captureAndVerify();
          }
      }, 1000); // Scan every 1 second for better responsiveness

      return () => clearInterval(intervalId);
  }, [captureAndVerify]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
        <div className="absolute top-4 left-4 z-10">
            <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
            >
            <BackIcon />
            </button>
        </div>

        <h2 className="text-3xl font-bebas text-[var(--color-text-primary)] mb-2">Verifikasi Pembayaran</h2>
        <p className="text-[var(--color-text-muted)] mb-4 text-center max-w-md">
            Arahkan bukti pembayaran (layar HP ke kamera) agar nominal <strong className="text-[var(--color-text-primary)] text-xl">Rp {targetAmount.toLocaleString()}</strong> terlihat jelas.
        </p>

        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-[var(--color-border-primary)] w-full max-w-md aspect-[3/4]">
            {!stream && scanStatus !== 'success' && (
                 <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                     {logs}
                 </div>
            )}
            
            {/* Camera Feed */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                onLoadedMetadata={() => {
                    // Ensure video plays once metadata is loaded
                    videoRef.current?.play().catch(e => console.error("Play failed", e));
                }}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(1)' }} 
            />
            
            {/* Overlay Guide */}
            {scanStatus !== 'success' && (
                <div className="absolute inset-0 border-[2px] border-white/30 pointer-events-none flex flex-col items-center justify-start pt-12">
                    <div className={`w-3/4 h-1/5 border-2 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors duration-300 ${scanStatus === 'duplicate' ? 'border-red-500 bg-red-500/20' : 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'}`}>
                        <span className="text-white text-sm font-bold bg-black/50 px-2 rounded shadow-sm">
                            {scanStatus === 'duplicate' ? 'Duplikat!' : 'Area Nominal'}
                        </span>
                    </div>
                </div>
            )}

            {/* Status / Logs Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-center transition-colors duration-300">
                {scanStatus === 'analyzing' && (
                     <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold animate-pulse">
                         <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                         {logs}
                     </div>
                )}
                {scanStatus === 'duplicate' && (
                    <div className="text-red-500 font-bold animate-shake">
                        ⚠️ {logs}
                    </div>
                )}
                {scanStatus === 'scanning' && (
                    <div className="text-white font-medium">
                        {logs}
                    </div>
                )}
                {scanStatus === 'idle' && (
                    <div className="text-[var(--color-text-muted)] text-sm">
                        {logs}
                    </div>
                )}
            </div>
            
            {/* Success Overlay */}
            {scanStatus === 'success' && (
                <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center z-30 animate-fade-in">
                    <div className="bg-white rounded-full p-4 mb-4 shadow-lg scale-110">
                        <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white drop-shadow-md">Pembayaran Diterima!</h3>
                    <p className="text-white mt-2 font-medium">Sedang memproses...</p>
                </div>
            )}
        </div>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default PaymentVerificationScreen;
