
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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
        setError('URL cannot be empty.');
        return;
    }
    try {
        new URL(newImageUrl);
        onAdd(newImageUrl.trim());
        setNewImageUrl('');
        setError('');
    } catch (_) {
        setError('Please enter a valid URL.');
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
                Open Google Photos, click a photo, right-click on it, and select "Copy Image Address". Paste that direct URL below.
              </p>
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                  <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Paste direct image URL here (e.g., from Google Photos)"
                      className="flex-grow bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                  />
                  <button type="submit" className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-2 px-6 rounded-md flex items-center justify-center gap-2">
                      <AddIcon /> Add
                  </button>
              </form>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
              {onlineHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {onlineHistory.map(entry => (
                    <div key={entry.id} className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-2 flex flex-col">
                      <img src={entry.embedUrl} alt={`Online history item`} className="w-full aspect-[2/3] object-cover rounded-md" />
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
