
import React from 'react';
import { PriceList } from '../types';
import { BackIcon } from './icons/BackIcon';

interface PaymentScreenProps {
  priceList: PriceList;
  qrisImageUrl?: string;
  onPaid: () => void;
  onBack: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ priceList, qrisImageUrl, onPaid, onBack }) => {
    // Determine image source: if it's a direct link or proxied
    const displayImage = qrisImageUrl ? (qrisImageUrl.startsWith('http') ? `https://images.weserv.nl/?url=${encodeURIComponent(qrisImageUrl)}` : qrisImageUrl) : null;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
            <div className="absolute top-4 left-4">
                <button 
                onClick={onBack}
                className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-none border-2 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Go Back"
                >
                <BackIcon />
                </button>
            </div>

            <div className="bg-[var(--color-bg-secondary)] p-8 rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] border-4 border-[var(--color-border-primary)] max-w-lg w-full text-center">
                <h2 className="text-3xl font-bebas text-[var(--color-text-primary)] mb-2">Pembayaran QRIS</h2>
                <p className="text-[var(--color-text-muted)] mb-6">Silakan scan QR Code di bawah ini</p>
                
                <div className="bg-white p-4 rounded-none border-2 border-black inline-block mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                    {displayImage ? (
                        <img src={displayImage} alt="QRIS Code" className="w-64 h-auto object-contain" />
                    ) : (
                        <div className="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                            QRIS Image Not Set
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <p className="text-sm text-[var(--color-text-secondary)] uppercase tracking-widest mb-1 font-bold">Total Pembayaran</p>
                    <p className="text-4xl font-bold text-[var(--color-accent-primary)] font-mono">Rp {priceList.price.toLocaleString()}</p>
                    <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] border-2 border-[var(--color-border-secondary)] rounded-none text-[var(--color-text-primary)] text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        ⚠️ PENTING: Pastikan nominal pembayaran sesuai dengan yang tertera di atas.
                    </div>
                </div>

                <button
                    onClick={onPaid}
                    className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-4 px-8 rounded-none border-4 border-black text-xl transition-all transform hover:scale-105 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2"
                >
                    Saya Sudah Bayar
                </button>
            </div>
        </div>
    );
};

export default PaymentScreen;
