
import React, { useState } from 'react';
import { BackIcon } from './icons/BackIcon';

interface GuestInputScreenProps {
  onNext: (userName: string) => void;
  onBack: () => void;
}

const GuestInputScreen: React.FC<GuestInputScreenProps> = ({ onNext, onBack }) => {
  const [userName, setUserName] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onNext(userName.trim());
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-[var(--color-bg-primary)] p-4">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-none border-2 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] p-8 border-4 border-[var(--color-border-primary)] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center animate-fade-in">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-6">Siapa Nama Kamu?</h2>
        
        <form onSubmit={handleNext} className="w-full">
            <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Masukkan Nama..."
                className="w-full bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-4 px-6 text-xl text-center text-[var(--color-text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent-primary)] mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                autoFocus
                required
            />
            
            <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-8 rounded-none border-4 border-black text-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
                Lanjut
            </button>
        </form>
      </div>
    </div>
  );
};

export default GuestInputScreen;
