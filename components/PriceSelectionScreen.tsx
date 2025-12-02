
import React, { useState } from 'react';
import { PriceList } from '../types';
import { BackIcon } from './icons/BackIcon';

interface PriceSelectionScreenProps {
  priceLists: PriceList[];
  onSelect: (priceList: PriceList) => void;
  onBack: () => void;
  onNext: (userName: string) => void;
}

const PriceSelectionScreen: React.FC<PriceSelectionScreenProps> = ({ priceLists, onSelect, onBack, onNext }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const handleSelect = (pkg: PriceList) => {
      setSelectedId(pkg.id);
      onSelect(pkg);
  };

  const handleNext = () => {
      if (selectedId && userName.trim()) {
          onNext(userName.trim());
      }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className="absolute top-4 left-4">
            <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-none border-2 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            aria-label="Go Back"
            >
            <BackIcon />
            </button>
        </div>

        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-2">Select Package</h2>
        <p className="text-[var(--color-text-muted)] mb-8">Pilih paket foto yang Anda inginkan</p>
        
        {/* Added p-4 instead of px-4 to prevent hover cutoff */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 mb-8 overflow-y-auto max-h-[50vh] scrollbar-thin">
            {priceLists.map(pkg => (
                <div 
                    key={pkg.id}
                    onClick={() => handleSelect(pkg)}
                    className={`cursor-pointer rounded-none p-6 border-4 transition-all transform hover:scale-105 ${selectedId === pkg.id ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-secondary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{pkg.name}</h3>
                    <p className="text-3xl font-bebas text-[var(--color-text-accent)] mb-4">Rp {pkg.price.toLocaleString()}</p>
                    <p className="text-xl text-[var(--color-text-secondary)] font-mono">{pkg.description}</p>
                </div>
            ))}
        </div>

        {selectedId && (
            <div className="w-full max-w-md px-4 animate-fade-in">
                <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)] uppercase">Nama Pesanan</label>
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Masukkan Nama Anda"
                    className="w-full bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-3 px-4 text-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent-primary)] mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                
                <button
                    onClick={handleNext}
                    disabled={!userName.trim()}
                    className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-8 rounded-none border-4 border-black text-xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Lanjut ke Pembayaran
                </button>
            </div>
        )}
    </div>
  );
};

export default PriceSelectionScreen;
