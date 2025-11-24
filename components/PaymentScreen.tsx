
import React, { useState, useEffect } from 'react';
import { PaymentEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { getCachedImage, storeImageInCache } from '../utils/db';

interface PaymentScreenProps {
  payment: PaymentEntry | null;
  qrisImageUrl: string;
  onPaid: () => void;
  onBack: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ payment, qrisImageUrl, onPaid, onBack }) => {
  const [qrisSrc, setQrisSrc] = useState<string>('');

  useEffect(() => {
      // Load cached QRIS image logic
      const loadQris = async () => {
          if (!qrisImageUrl) return;
          try {
              const cached = await getCachedImage(qrisImageUrl);
              if (cached) {
                  setQrisSrc(URL.createObjectURL(cached));
              } else {
                   let fetchUrl = qrisImageUrl;
                   if (qrisImageUrl.startsWith('http')) {
                        fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(qrisImageUrl)}`;
                   }
                   const res = await fetch(fetchUrl);
                   const blob = await res.blob();
                   await storeImageInCache(qrisImageUrl, blob);
                   setQrisSrc(URL.createObjectURL(blob));
              }
          } catch (e) {
              console.error("Failed to load QRIS", e);
              // Fallback to original URL if caching fails
              setQrisSrc(qrisImageUrl);
          }
      };
      loadQris();
  }, [qrisImageUrl]);

  if (!payment) return null;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 overflow-y-auto scrollbar-thin">
       <div className="absolute top-4 left-4 z-10">
        <button onClick={onBack} className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors">
            <BackIcon />
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan QRIS to Pay</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-gray-500 text-sm">Total Payment</p>
              <p className="text-4xl font-bold text-gray-900">Rp {payment.amount.toLocaleString()}</p>
          </div>
          
          <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-4 border-2 border-dashed border-gray-300 relative">
             {qrisSrc ? (
                 <img src={qrisSrc} alt="QRIS Code" className="w-full h-full object-contain" />
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-400">Loading QRIS...</div>
             )}
          </div>
          
          <div className="text-left text-sm text-gray-600 mb-6 bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="font-bold text-yellow-700 mb-1">⚠️ Important:</p>
              <ul className="list-disc list-inside space-y-1">
                  <li>Transfer exact amount: <b>Rp {payment.amount.toLocaleString()}</b></li>
                  <li>Use "<b>{payment.userOrderName}</b>" as transfer note if possible.</li>
                  <li>After successful transfer, click the button below.</li>
              </ul>
          </div>
          
          <button 
            onClick={onPaid}
            className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-4 rounded-xl text-xl shadow-lg transform transition hover:scale-105"
          >
              Saya Sudah Bayar
          </button>
      </div>
    </div>
  );
};

export default PaymentScreen;
