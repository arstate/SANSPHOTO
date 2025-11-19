
import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { BackIcon } from './icons/BackIcon';

// Declare Html5Qrcode global from CDN
declare const Html5Qrcode: any;

interface KeyCodeScreenProps {
  onKeyCodeSubmit: (code: string) => void;
  onBack: () => void;
  error: string | null;
  isLoading: boolean;
}

const KeyCodeScreen: React.FC<KeyCodeScreenProps> = ({ onKeyCodeSubmit, onBack, error, isLoading }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const scannerContainerId = "reader";

  // Handle QR Scanning
  useEffect(() => {
      if (typeof Html5Qrcode === 'undefined') {
          console.warn("Html5Qrcode library not found.");
          return;
      }

      let html5QrCode: any = null;

      const startScanner = async () => {
          try {
            html5QrCode = new Html5Qrcode(scannerContainerId);
            await html5QrCode.start(
                { facingMode: "user" }, // Gunakan kamera depan
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText: string) => {
                    const cleanCode = decodedText.trim().toUpperCase();
                    
                    // Validasi dasar: harus 4 karakter alfanumerik
                    if (/^[A-Z0-9]{4}$/.test(cleanCode)) {
                        // Pause atau stop setelah berhasil
                        html5QrCode.pause();
                        console.log(`Scan success: ${cleanCode}`);
                        
                        // Update UI input manual agar user melihat kode yang terscan
                        setCode(cleanCode.split(''));

                        // Panggil fungsi submit
                        onKeyCodeSubmit(cleanCode);
                    }
                },
                (errorMessage: any) => {
                   // Ignore scan errors (common when no QR is in frame)
                }
            );
            setIsScannerReady(true);
          } catch (err) {
              console.error("Error starting scanner", err);
          }
      };

      startScanner();

      return () => {
          if (html5QrCode) {
              html5QrCode.stop().then(() => {
                  html5QrCode.clear();
              }).catch((err: any) => {
                  console.error("Failed to stop scanner", err);
              });
          }
      };
  }, [onKeyCodeSubmit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Fokus ke input berikutnya jika ada nilai
      if (value && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 4 && !isLoading) {
      onKeyCodeSubmit(fullCode);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-[var(--color-bg-primary)]">
      
      {/* Tombol Kembali */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-md px-4 flex flex-col items-center z-10 h-full py-4 overflow-y-auto scrollbar-thin">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-2 text-center">Scan QR Code</h2>
        <p className="text-[var(--color-text-muted)] mb-6 text-center">Arahkan kode QR ke kamera untuk memulai sesi otomatis.</p>

        {/* Container Scanner */}
        <div className="relative w-full max-w-[300px] aspect-square bg-black rounded-xl overflow-hidden mb-8 border-4 border-[var(--color-accent-primary)] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            {/* Loading State */}
            {!isScannerReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                    Starting Camera...
                </div>
            )}
            
            {/* Elemen Library Scanner */}
            <div id={scannerContainerId} className="w-full h-full"></div>
            
            {/* Overlay Visual untuk Target Scan */}
            <div className="absolute inset-0 border-[2px] border-white/20 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--color-accent-primary)] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--color-accent-primary)] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--color-accent-primary)] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--color-accent-primary)] rounded-br-lg"></div>
            </div>
        </div>

        {/* Manual Input Section */}
        <div className="w-full bg-[var(--color-bg-secondary)]/50 p-6 rounded-xl border border-[var(--color-border-primary)]">
            <p className="text-center text-[var(--color-text-secondary)] mb-4 text-sm font-bold uppercase tracking-widest">Atau Masukkan Kode Manual</p>
            
            <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-3 mb-6">
                {code.map((digit, index) => (
                <input
                    key={index}
                    ref={el => { inputsRef.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-14 h-16 sm:w-16 sm:h-20 bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-secondary)] rounded-lg text-center text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all uppercase"
                    autoComplete="off"
                    disabled={isLoading}
                />
                ))}
            </div>

            {error && <div className="text-red-400 text-center mb-4 bg-red-900/20 p-2 rounded text-sm font-semibold animate-pulse">{error}</div>}

            <button
                type="submit"
                disabled={isLoading || code.join('').length < 4}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
                {isLoading ? 'Processing...' : 'Start Session'}
            </button>
            </form>
        </div>
      </div>

      {/* CSS Override untuk memperbaiki tampilan kamera (Agar TIDAK mirror/flip) */}
      <style>{`
        #${scannerContainerId} video {
            object-fit: cover;
            border-radius: 0.5rem;
            /* PENTING: Paksa transformasi normal agar teks QR terbaca dan tidak terbalik */
            transform: scaleX(1) !important; 
        }
      `}</style>
    </div>
  );
};

export default KeyCodeScreen;
