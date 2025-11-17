import React, { useState, useEffect } from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface OnlineHistoryScreenProps {
  onBack: () => void;
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyscGKm6RSnFw2b3PMzQfGUhuWUxWKViW73fjoPp_5nvG3OxoWN3lJYY38tP7FvaOaL/exec';

const OnlineHistoryScreen: React.FC<OnlineHistoryScreenProps> = ({ onBack }) => {
  const [photos, setPhotos] = useState<OnlineHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
          throw new Error(`Gagal mengambil data: ${response.statusText}`);
        }
        const data: OnlineHistoryEntry[] = await response.json();
        // Urutkan berdasarkan waktu, terbaru lebih dulu
        const sortedData = data.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
        setPhotos(sortedData);
      } catch (err) {
        console.error("Error fetching online history:", err);
        setError("Tidak dapat memuat histori online. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);
  
  const handleDownload = async (entry: OnlineHistoryEntry) => {
    try {
        // Karena thumbnail Google Drive dilindungi CORS, kita tidak bisa mengambilnya sebagai blob.
        // Solusinya adalah membuka link di tab baru agar pengguna dapat menyimpannya secara manual.
        alert('Could not download the image directly due to security restrictions. Opening in a new tab for you to save manually.');
        window.open(entry.url, '_blank');
    } catch (error) {
        console.error('Error opening image:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-text-accent)] mb-4"></div>
          <p>Memuat galeri...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
          <p className="font-bold">Oops! Terjadi kesalahan.</p>
          <p>{error}</p>
        </div>
      );
    }

    if (photos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Belum Ada Foto</h3>
          <p>Histori online masih kosong. Cek kembali nanti!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {photos.map(entry => (
          <div key={entry.nama} className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden aspect-w-2 aspect-h-3">
            <img src={entry.url} alt={entry.nama} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                    onClick={() => handleDownload(entry)}
                    className="bg-green-500/80 hover:bg-green-500 text-white font-bold p-3 rounded-full transition-transform transform hover:scale-110"
                    aria-label="Download Photo"
                >
                    <DownloadIcon />
                </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full bg-[var(--color-bg-primary)]">
      <header className="sticky top-0 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm z-10 p-4 flex items-center justify-center">
        <div className="absolute top-4 left-4">
          <button
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
          >
            <BackIcon />
          </button>
        </div>
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Online History</h2>
      </header>
      
      <main className="flex-grow overflow-y-auto scrollbar-thin p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default OnlineHistoryScreen;