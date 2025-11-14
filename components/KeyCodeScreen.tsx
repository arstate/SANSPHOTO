import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { BackIcon } from './icons/BackIcon';

interface KeyCodeScreenProps {
  onKeyCodeSubmit: (code: string) => void;
  onBack: () => void;
  error: string | null;
  isLoading: boolean;
}

const KeyCodeScreen: React.FC<KeyCodeScreenProps> = ({ onKeyCodeSubmit, onBack, error, isLoading }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="absolute top-4 left-4">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-sm text-center">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-2">Enter Session Code</h2>
        <p className="text-[var(--color-text-muted)] mb-6">Please enter the 4-character code provided to start.</p>

        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg text-left text-sm mb-8 border border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-accent)] mb-2">Cara Mendapatkan Kode:</h3>
            <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>Lakukan pembayaran di kasir.</li>
                <li>Admin akan memberikan kode sesi unik.</li>
                <li>Masukan kode sesi yang diberikan di bawah ini.</li>
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
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || code.join('').length < 4}
            className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed disabled:transform-none"
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