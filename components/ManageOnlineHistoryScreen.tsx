
import React, { useState } from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ManageOnlineHistoryScreenProps {
  onlineHistory: OnlineHistoryEntry[];
  onBack: () => void;
  onAdd: (embedUrl: string) => void;
  onDelete: (entryId: string) => void;
}

const ManageOnlineHistoryScreen: React.FC<ManageOnlineHistoryScreenProps> = ({
  onlineHistory, onBack, onAdd, onDelete
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUrl.trim()) {
      setError('Google Photos share link cannot be empty.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Menggunakan proxy yang lebih andal untuk menghindari masalah CORS
      const proxyUrl = `https://thingproxy.freeboard.io/fetch/${shareUrl}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch the provided URL. Status: ${response.status}`);
      }
      const htmlText = await response.text();
      
      // Mencari URL gambar yang disematkan di dalam tag meta 'og:image'
      const match = htmlText.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
      const embedUrl = match ? match[1] : null;

      if (embedUrl) {
        if (onlineHistory.some(entry => entry.embedUrl === embedUrl)) {
            setError('This photo has already been added to the history.');
            setIsLoading(false);
            return;
        }
        onAdd(embedUrl);
        setShareUrl('');
      } else {
        setError('Could not find an embeddable image URL in the provided link. Please ensure it is a valid Google Photos link.');
      }

    } catch (err) {
      console.error("Error generating embed link:", err);
      setError('Failed to process the link. Please check the URL and your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Manage Online History</h2>
      </header>
      
      <main className="w-full max-w-4xl mx-auto flex flex-col min-h-0">
          <div className="shrink-0 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg mb-6">
              <h3 className="text-2xl font-bebas tracking-wider text-[var(--color-text-accent)] mb-2">Add New Photo</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Open Google Photos, select a photo, click the 'Share' icon, create a link, and paste that share link below. The app will automatically generate the embed code.
              </p>
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                  <input
                      type="url"
                      value={shareUrl}
                      onChange={(e) => setShareUrl(e.target.value)}
                      placeholder="Paste Google Photos share link here (e.g., https://photos.app.goo.gl/...)"
                      className="flex-grow bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                      disabled={isLoading}
                  />
                  <button type="submit" className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-2 px-6 rounded-md flex items-center justify-center gap-2 w-full sm:w-auto disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait" disabled={isLoading}>
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <AddIcon />
                      )}
                      {isLoading ? 'Processing...' : 'Add'}
                  </button>
              </form>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
              {onlineHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {onlineHistory.map(entry => (
                    <div key={entry.id} className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-2 flex flex-col">
                      <img src={entry.embedUrl} alt={`Online history item`} className="w-full object-contain rounded-md" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                              onClick={() => onDelete(entry.id)}
                              className="bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)] font-bold p-4 rounded-full transition-transform transform hover:scale-110"
                              aria-label="Delete Photo"
                          >
                              <TrashIcon />
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[var(--color-text-muted)] py-16">
                  <p>No photos have been added to the online history yet.</p>
                </div>
              )}
          </div>
      </main>
    </div>
  );
};

export default ManageOnlineHistoryScreen;
