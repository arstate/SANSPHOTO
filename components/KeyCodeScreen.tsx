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
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const scannerRef = useRef<any>(null);

  // Handle QR Scanning in Background
  useEffect(() => {
      if (typeof Html5Qrcode === 'undefined') {
          console.warn("Html5Qrcode library not found.");
          return;
      }

      const onScanSuccess = (decodedText: string, decodedResult: any) => {
          // Bersihkan input (biasanya format 4 karakter kapital)
          const cleanCode = decodedText.trim().toUpperCase();
          
          // Validasi dasar: harus 4 karakter alfanumerik
          if (/^[A-Z0-9]{4}$/.test(cleanCode) && !isLoading) {
              console.log(`Scan success: ${cleanCode}`);
              // Hentikan scanner agar tidak submit berkali-kali
              if (scannerRef.current) {
                  scannerRef.current.pause(true); // Pause scanner
              }
              onKeyCodeSubmit(cleanCode);
          }
      };

      const onScanFailure = (error: any) => {
          // console.warn(`Code scan error = ${error}`);
      };

      const startScanner = async () => {
          try {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            
            await html5QrCode.start(
                { facingMode: "environment" }, 
                {
                    fps: 10,
                    qrbox: 250,
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
          } catch (err) {
              console.error("Error starting scanner", err);
          }
      };

      startScanner();

      return () => {
          if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                  scannerRef.current.clear();
              }).catch((err: any) => {
                  console.error("Failed to stop scanner", err);
              });
          }
      };
  }, [isLoading, onKeyCodeSubmit]);

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
    // Pindah fokus ke input sebelumnya saat menekan backspace pada input kosong
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
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden">
      {/* Hidden Scanner Element */}
      <div id="reader" className="fixed top-0 left-0 w-1 h-1 opacity-0 -z-10 pointer-events-none"></div>

      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-sm text-center z-10">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-2">Enter Session Code</h2>
        <p className="text-[var(--color-text-muted)] mb-6">Scan QR code atau masukan kode manual yang diberikan admin.</p>

        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg text-left text-sm mb-8 border border-[var(--color-border-primary)] shadow-lg">
            <h3 className="font-bold text-[var(--color-text-accent)] mb-2">Cara Masuk:</h3>
            <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>Arahkan kamera ke <strong>QR Code</strong> sesi Anda (Scan otomatis).</li>
                <li>Atau ketik 4 digit kode sesi di bawah ini.</li>
            </ol>
        </div>


        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-4">
            {code.map((digit, index) => (
              <input
                key={index}
                // FIX: The ref callback was implicitly returning the assigned value, causing a type error.
                // Wrapped the assignment in curly braces to ensure the callback returns void.
                ref={el => { inputsRef.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-16 h-20 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-secondary)] rounded-lg text-center text-4xl font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                autoFocus={index === 0}
                disabled={isLoading}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-center mb-4 bg-red-900/20 p-2 rounded">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || code.join('').length < 4}
            className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
            ) : (
                'Start Session'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KeyCodeScreen;