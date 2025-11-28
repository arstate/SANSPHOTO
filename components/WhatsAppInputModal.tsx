
import React, { useState } from 'react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface WhatsAppInputModalProps {
  onConfirm: (phoneNumber: string) => void;
  onClose: () => void;
}

const WhatsAppInputModal: React.FC<WhatsAppInputModalProps> = ({ onConfirm, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onConfirm(phoneNumber.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-sm border border-[var(--color-border-primary)]" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center mb-4">
            <div className="bg-green-500 text-white p-3 rounded-full mb-3">
                <WhatsAppIcon />
            </div>
            <h2 className="font-bebas text-3xl text-center text-[var(--color-text-primary)]">Kirim ke WhatsApp</h2>
            <p className="text-center text-[var(--color-text-muted)] text-sm">
                Masukkan nomor WhatsApp Anda untuk menerima file foto.
            </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="waNumber" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Nomor WhatsApp</label>
            <input
              id="waNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-3 px-4 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              required
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Admin kami akan mengirimkan foto Anda ke nomor ini.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full text-lg transition-colors shadow-lg">
              Kirim Nomor
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppInputModal;
