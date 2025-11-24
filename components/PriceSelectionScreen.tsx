
import React, { useState } from 'react';
import { PriceList } from '../types';
import { BackIcon } from './icons/BackIcon';

interface PriceSelectionScreenProps {
  priceLists: PriceList[];
  onSelect: (priceListId: string, userOrderName: string) => void;
  onBack: () => void;
}

const PriceSelectionScreen: React.FC<PriceSelectionScreenProps> = ({ priceLists, onSelect, onBack }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const handleSubmit = () => {
      if (selectedId && userName.trim()) {
          onSelect(selectedId, userName.trim());
      }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onBack} className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors">
            <BackIcon />
        </button>
      </div>

      <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-2">Select Your Package</h2>
      <p className="text-[var(--color-text-muted)] mb-8">Choose a photo package to start your session.</p>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {priceLists.map(price => (
              <div 
                key={price.id}
                onClick={() => setSelectedId(price.id)}
                className={`cursor-pointer p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${selectedId === price.id ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]'}`}
              >
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{price.name}</h3>
                  <p className="text-3xl font-bold text-[var(--color-text-accent)] mb-4">Rp {price.price.toLocaleString()}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{price.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] inline-block px-2 py-1 rounded">
                      Max {price.maxTakes} Photos
                  </p>
              </div>
          ))}
      </div>

      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border-primary)]">
          <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Your Name (Order Name)</label>
          <input 
            type="text" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Budi Santoso"
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-3 px-4 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] mb-4"
          />
          <button 
            onClick={handleSubmit}
            disabled={!selectedId || !userName.trim()}
            className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
              Continue to Payment
          </button>
      </div>
    </div>
  );
};

export default PriceSelectionScreen;
