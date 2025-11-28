
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BackIcon } from './icons/BackIcon';
import { CameraIcon } from './icons/CameraIcon';
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed' | 'duplicate'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<string>('');

  const stopCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
  };

  const startCamera = async () => {
    try {
        stopCamera(); // Ensure clean slate
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
        }
    } catch (err) {
        console.error("Camera error:", err);
        setLogs("Gagal akses kamera.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const generateImageHash = async (base64Image: string): Promise<string> => {
      // Simple hash based on image data length and center pixel sample
      // For production, a perceptual hash is better, but this prevents exact file reuse in session
      const len = base64Image.length;
      const sample = base64Image.substring(len / 2 - 20, len / 2 + 20);
      let hash = 0;
      const str = len + sample;
      for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString();
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setScanStatus('scanning');
    setLogs('Mengambil gambar...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video to canvas (No Mirroring as requested)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    stopCamera(); // Stop camera while processing

    // 1. Check Duplication Hash
    setLogs('Memeriksa duplikasi...');
    const hash = await generateImageHash(dataUrl);
    const isDuplicate = await validateProofHash(hash);
    
    if (isDuplicate) {
        setScanStatus('duplicate');
        setIsScanning(false);
        return;
    }

    // 2. OCR Processing
    setLogs('Membaca teks bukti pembayaran...');
    try {
        const result = await Tesseract.recognize(
            dataUrl,
            'eng',
            { logger: (m: any) => {
                if (m.status === 'recognizing text') {
                    setLogs(`Scanning... ${Math.round(m.progress * 100)}%`);
                }
            }}
        );

        const text = result.data.text;
        console.log("OCR Result:", text);
        
        // Clean text and look for amount
        // Remove non-numeric chars except . and ,
        const cleanText = text.replace(/[^0-9.,]/g, ' '); 
        const amountString = targetAmount.toLocaleString('id-ID'); // e.g. "25.000"
        const amountPlain = targetAmount.toString(); // "25000"
        
        // Check if amount exists in text (allowing for some OCR errors like 'O' instead of '0' handled by regex above roughly)
        // Better strategy: Check if we find the number sequence
        const found = cleanText.includes(amountString) || cleanText.includes(amountPlain) || cleanText.includes(amountPlain.replace(/000$/, '.000'));
        
        if (found) {
            setScanStatus('success');
            setTimeout(() => onVerified(hash), 1500);
        } else {
            setScanStatus('failed');
        }

    } catch (err) {
        console.error(err);
        setScanStatus('failed');
        setLogs('Gagal membaca gambar.');
    } finally {
        setIsScanning(false);
    }
  };

  const handleRetry = () => {
      setScanStatus('idle');
      setCapturedImage(null);
      setLogs('');
      startCamera();
  };

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
            Arahkan bukti pembayaran (layar HP ke kamera) agar nominal <strong className="text-white">Rp {targetAmount.toLocaleString()}</strong> terlihat jelas.
        </p>

        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-[var(--color-border-primary)] w-full max-w-md aspect-[3/4]">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured Proof" className="w-full h-full object-cover" />
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(1)' }} // No Flip as requested
                />
            )}
            
            {/* Overlay Guide - Moved to TOP and Text changed to WHITE */}
            {!capturedImage && (
                <div className="absolute inset-0 border-[2px] border-white/30 pointer-events-none flex flex-col items-center justify-start pt-12">
                    <div className="w-3/4 h-1/5 border-2 border-[var(--color-accent-primary)] rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <span className="text-white text-sm font-bold bg-black/50 px-2 rounded shadow-sm">Area Nominal</span>
                    </div>
                </div>
            )}

            {/* Status Overlay */}
            {isScanning && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="text-white font-bold">{logs}</p>
                </div>
            )}
            
            {scanStatus === 'success' && (
                <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center z-20 animate-fade-in">
                    <div className="bg-white rounded-full p-4 mb-4">
                        <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Pembayaran Diterima!</h3>
                    <p className="text-white mt-2">Memulai sesi...</p>
                </div>
            )}

            {scanStatus === 'duplicate' && (
                <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center z-20 animate-fade-in p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Bukti Sudah Digunakan!</h3>
                    <p className="text-white mb-6">Bukti pembayaran ini telah dipakai sebelumnya.</p>
                    <button onClick={handleRetry} className="bg-white text-red-500 font-bold py-3 px-8 rounded-full flex items-center gap-2">
                        <RestartIcon /> Coba Lagi
                    </button>
                </div>
            )}

            {scanStatus === 'failed' && (
                <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20 animate-fade-in p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Verifikasi Gagal</h3>
                    <p className="text-white mb-6">Nominal tidak terbaca atau tidak sesuai. Pastikan gambar jelas dan tidak buram.</p>
                    <button onClick={handleRetry} className="bg-white text-red-900 font-bold py-3 px-8 rounded-full flex items-center gap-2">
                        <RestartIcon /> Foto Ulang
                    </button>
                </div>
            )}
        </div>

        {!isScanning && scanStatus === 'idle' && (
            <button
                onClick={captureAndVerify}
                className="mt-6 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-all shadow-lg flex items-center gap-3 transform hover:scale-105"
            >
                <CameraIcon />
                Scan Bukti
            </button>
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default PaymentVerificationScreen;
