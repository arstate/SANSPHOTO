import React from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface OnlineHistoryScreenProps {
  onlineHistory: OnlineHistoryEntry[];
  onBack: () => void;
}

const OnlineHistoryScreen: React.FC<OnlineHistoryScreenProps> = ({ onlineHistory, onBack }) => {

  const handleDownload = async (entry: OnlineHistoryEntry) => {
    try {
        // Gunakan proksi yang lebih andal untuk menghindari masalah CORS
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(entry.embedUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `sans-photo-${entry.timestamp}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Could not download the image. Please try again.');
    }
  };

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

      <header className="text-center shrink-0 my-4 px-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Online Gallery</h2>
        <p className="text-[var(--color-text-muted)]">Check out photos from our events!</p>
      </header>

      <main className="w-full flex-grow overflow-y-auto scrollbar-thin p-4">
        {onlineHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {onlineHistory.map(entry => (
              <div key={entry.id} className="group relative aspect-w-1 aspect-h-1 bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden border-2 border-transparent hover:border-[var(--color-accent-primary)] transition-all duration-300 shadow-lg">
                <img src={entry.embedUrl} alt="Online gallery item" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                  <p className="text-white text-xs font-semibold drop-shadow-md">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                  <button 
                    onClick={() => handleDownload(entry)}
                    className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white p-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" 
                    aria-label="Download Photo"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
            <h3 className="text-2xl font-bold">The Gallery is Empty</h3>
            <p className="mt-2">Check back later for photos from our amazing events!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OnlineHistoryScreen;
