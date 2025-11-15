import React from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface OnlineHistoryScreenProps {
  history: OnlineHistoryEntry[];
  isAdminLoggedIn: boolean;
  onBack: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const OnlineHistoryScreen: React.FC<OnlineHistoryScreenProps> = ({ history, isAdminLoggedIn, onBack, onAdd, onDelete }) => {

  const getProxiedUrl = (url: string) => {
    if (!url || !url.startsWith('http')) {
        return url;
    }
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  };
  
  const handleDownload = async (entry: OnlineHistoryEntry) => {
    try {
        const response = await fetch(getProxiedUrl(entry.googlePhotosUrl));
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `sans-photo-online-${entry.timestamp}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Could not download the image. Please try again.');
    }
  };

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
        {isAdminLoggedIn && (
            <div className="absolute top-4 right-4">
                <button
                    onClick={onAdd}
                    className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold p-3 rounded-full transition-colors flex items-center gap-2"
                    aria-label="Add Photos"
                >
                    <AddIcon />
                </button>
            </div>
        )}
      </header>
      
      <main className="flex-grow overflow-y-auto scrollbar-thin p-4">
        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map(entry => (
              <div key={entry.id} className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden aspect-w-2 aspect-h-3">
                <img src={getProxiedUrl(entry.googlePhotosUrl)} alt={`Online history item ${entry.id}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                        onClick={() => handleDownload(entry)}
                        className="bg-green-500/80 hover:bg-green-500 text-white font-bold p-3 rounded-full transition-transform transform hover:scale-110"
                        aria-label="Download Photo"
                    >
                        <DownloadIcon />
                    </button>
                   {isAdminLoggedIn && (
                     <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this photo from the online history?')) {
                                onDelete(entry.id);
                            }
                        }}
                        className="bg-red-600/80 hover:bg-red-600 text-white font-bold p-3 rounded-full transition-transform transform hover:scale-110"
                        aria-label="Delete History Entry"
                    >
                        <TrashIcon />
                    </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No Photos Yet</h3>
            <p>The online history is empty. Check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OnlineHistoryScreen;
