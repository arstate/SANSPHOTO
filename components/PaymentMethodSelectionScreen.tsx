
import React from 'react';
import { BackIcon } from './icons/BackIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { ShopIcon } from './icons/ShopIcon';

interface PaymentMethodSelectionScreenProps {
  onSelectQris: () => void;
  onSelectCashier: () => void;
  onBack: () => void;
}

const PaymentMethodSelectionScreen: React.FC<PaymentMethodSelectionScreenProps> = ({ onSelectQris, onSelectCashier, onBack }) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
      <div className="absolute top-4 left-4">
        <button 
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-8">Pilih Metode Pembayaran</h2>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        {/* QRIS Option */}
        <button
          onClick={onSelectQris}
          className="flex-1 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 rounded-2xl p-8 flex flex-col items-center justify-center transition-all transform hover:scale-105 group"
        >
          <div className="bg-[var(--color-bg-tertiary)] p-6 rounded-full mb-4 group-hover:bg-[var(--color-accent-primary)] group-hover:text-white transition-colors">
             <div className="transform scale-150">
                <QrCodeIcon />
             </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">QRIS (Otomatis)</h3>
          <p className="text-[var(--color-text-secondary)] text-center text-sm">Scan QRIS, verifikasi otomatis, langsung foto.</p>
        </button>

        {/* Cashier Option */}
        <button
          onClick={onSelectCashier}
          className="flex-1 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-primary)] hover:border-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-2xl p-8 flex flex-col items-center justify-center transition-all transform hover:scale-105 group"
        >
          <div className="bg-[var(--color-bg-tertiary)] p-6 rounded-full mb-4 group-hover:bg-[var(--color-info)] group-hover:text-white transition-colors">
             <ShopIcon />
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Bayar di Kasir</h3>
          <p className="text-[var(--color-text-secondary)] text-center text-sm">Bayar tunai di kasir dan dapatkan Kode Sesi.</p>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelectionScreen;
