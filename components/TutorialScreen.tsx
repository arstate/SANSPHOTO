
import React from 'react';
import { BackIcon } from './icons/BackIcon';
import { DollarIcon } from './icons/DollarIcon';
import { TicketIcon } from './icons/TicketIcon';
import { CameraIcon } from './icons/CameraIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { PrintIcon } from './icons/PrintIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { Settings } from '../types';

interface TutorialScreenProps {
  onComplete: () => void;
  onBack: () => void;
  settings: Settings;
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete, onBack, settings }) => {
  
  const isLight = settings.theme === 'light';

  // Determine the first step based on configuration
  let step1Title = "Mulai Sesi";
  let step1Desc = "Tekan tombol start untuk memulai foto gratis.";
  let Step1Icon = TicketIcon;

  if (settings.isPaymentEnabled) {
      step1Title = "Pilih Paket & Bayar";
      step1Desc = "Pilih paket foto, isi nama, dan scan QRIS untuk pembayaran otomatis.";
      Step1Icon = DollarIcon;
  } else if (settings.isSessionCodeEnabled) {
      step1Title = "Scan / Input Kode";
      step1Desc = "Masukkan kode sesi atau scan QR tiket yang Anda miliki.";
      Step1Icon = TicketIcon;
  }

  const steps = [
    {
      id: 1,
      title: step1Title,
      desc: step1Desc,
      icon: <Step1Icon />,
      color: isLight ? 'text-green-700' : 'text-green-400',
      bg: isLight ? 'bg-green-100' : 'bg-green-900/30',
      border: isLight ? 'border-green-300' : 'border-green-500/50'
    },
    {
      id: 2,
      title: "Pilih Event & Template",
      desc: "Pilih bingkai foto (frame) yang Anda sukai sesuai tema event.",
      icon: <TicketIcon />, // Using TicketIcon as generic 'Selection' icon
      color: isLight ? 'text-purple-700' : 'text-purple-400',
      bg: isLight ? 'bg-purple-100' : 'bg-purple-900/30',
      border: isLight ? 'border-purple-300' : 'border-purple-500/50'
    },
    {
      id: 3,
      title: "Mulai Foto",
      desc: "Bergaya di depan kamera! Tunggu hitungan mundur dan flash.",
      icon: <CameraIcon />,
      color: isLight ? 'text-blue-700' : 'text-blue-400',
      bg: isLight ? 'bg-blue-100' : 'bg-blue-900/30',
      border: isLight ? 'border-blue-300' : 'border-blue-500/50'
    },
    {
      id: 4,
      title: "Simpan Foto",
      desc: "Download foto langsung atau scan QR Code untuk menyimpannya di HP.",
      icon: <DownloadIcon />,
      color: isLight ? 'text-amber-700' : 'text-yellow-400',
      bg: isLight ? 'bg-amber-100' : 'bg-yellow-900/30',
      border: isLight ? 'border-amber-300' : 'border-yellow-500/50'
    },
    {
      id: 5,
      title: "AMBIL CETAKAN",
      desc: "Hasil cetak fotomu bisa diambil ke kasir.",
      icon: <PrintIcon />,
      color: isLight ? 'text-rose-700' : 'text-rose-400',
      bg: isLight ? 'bg-rose-100' : 'bg-rose-900/30',
      border: isLight ? 'border-rose-300' : 'border-rose-500/50'
    }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 overflow-y-auto scrollbar-thin">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-none border-2 border-black transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <div className="w-full max-w-[1600px] mx-auto flex flex-col justify-center h-full min-h-min py-10">
        <header className="text-center mb-8 shrink-0">
            <h2 className="text-4xl md:text-5xl font-bebas tracking-widest text-[var(--color-text-primary)] mb-2">
                CARA MENGGUNAKAN
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg">Ikuti langkah mudah berikut untuk mendapatkan foto terbaikmu!</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 p-4 w-full place-items-center">
            {steps.map((step) => (
                <div 
                    key={step.id} 
                    className={`w-full flex flex-col items-center text-center p-6 rounded-none border-4 ${step.bg} ${step.border} backdrop-blur-sm transition-transform transform hover:scale-105 duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full`}
                >
                    <div className={`w-24 h-24 rounded-none flex items-center justify-center mb-6 bg-[var(--color-bg-primary)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0`}>
                        <div className="transform scale-150 text-black">
                            {step.icon}
                        </div>
                    </div>
                    <h3 className={`text-3xl font-bold mb-4 font-bebas tracking-wide text-black`}>
                        {step.id}. {step.title}
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed font-medium flex-grow font-mono">
                        {step.desc}
                    </p>
                </div>
            ))}
        </div>

        <div className="shrink-0 mt-6 mb-4 flex justify-center w-full">
            <button
                onClick={onComplete}
                className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-12 rounded-none text-2xl transition-all transform hover:scale-105 shadow-[8px_8px_0px_0px_#000000] border-4 border-black animate-pulse hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
                MENGERTI, MULAI FOTO!
            </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen;
