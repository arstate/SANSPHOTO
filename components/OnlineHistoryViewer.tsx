
import React, { useCallback } from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface OnlineHistoryViewerProps {
  onlineHistory: OnlineHistoryEntry[];
  onBack: () => void;
}

const OnlineHistoryViewer: React.FC<OnlineHistoryViewerProps> = ({ onlineHistory, onBack }) => {

  const handleDownload = useCallback(async (imageUrl: string) => {
    try {
        // Menggunakan proxy untuk mengatasi masalah CORS saat mengunduh
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sans-photo-online-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading image:", error);
        // Fallback: buka gambar di tab baru jika unduhan gagal
        window.open(imageUrl, '_blank');
    }
  }, []);

  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4 px-16">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Online History</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Browse and download photos from past events.</p>
      </header>
      
      <main className="w-full max-w-6xl mx-auto overflow-y-auto scrollbar-thin flex-grow px-4">
        {onlineHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onlineHistory.map(entry => (
              <div key={entry.id} className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-2 flex flex-col">
                <img src={entry.embedUrl} alt="Online history item" className="w-full object-contain rounded-md" loading="lazy" />
                <div className="absolute bottom-2 left-2 right-2 p-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => handleDownload(entry.embedUrl)}
                        className="bg-[var(--color-positive)]/80 backdrop-blur-sm hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold p-3 rounded-full transition-transform transform hover:scale-110 shadow-lg"
                        aria-label="Download Photo"
                    >
                        <DownloadIcon />
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-[var(--color-text-muted)] py-16">
            <p>No photos found in the online history. Please check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OnlineHistoryViewer;
