
import React, { useState } from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ManageOnlineHistoryScreenProps {
  onlineHistory: OnlineHistoryEntry[];
  onAddEntry: (url: string) => Promise<void>;
  onDeleteEntry: (id: string) => void;
  onBack: () => void;
}

const ManageOnlineHistoryScreen: React.FC<ManageOnlineHistoryScreenProps> = ({ onlineHistory, onAddEntry, onDeleteEntry, onBack }) => {
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await onAddEntry(newUrl.trim());
      setNewUrl('');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
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
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Manage Online Gallery</h2>
      </header>
      
      <main className="w-full max-w-4xl mx-auto flex flex-col min-h-0">
          {/* Add New Form */}
          <div className="shrink-0 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg mb-6">
              <h3 className="text-2xl font-bebas tracking-wider text-[var(--color-text-accent)] mb-2">Add Photo from Google Photos</h3>
              <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-grow w-full">
                      <label htmlFor="newUrl" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Google Photos Share Link</label>
                      <input
                          type="url"
                          id="newUrl"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="https://photos.app.goo.gl/..."
                          required
                          className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                      />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait">
                      {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <AddIcon />}
                      Add Photo
                  </button>
              </form>
              {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
          </div>
          
          {/* Gallery List */}
          <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {onlineHistory.map(entry => (
                      <div key={entry.id} className="group relative aspect-square bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden border border-[var(--color-border-primary)]">
                          <img src={entry.embedUrl} alt="Online gallery item" className="w-full h-full object-cover"/>
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => onDeleteEntry(entry.id)} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full" aria-label="Delete Photo">
                                  <TrashIcon />
                              </button>
                          </div>
                      </div>
                  ))}
                  {onlineHistory.length === 0 && (
                     <p className="col-span-full text-[var(--color-text-muted)] text-center py-12">No photos in the online gallery yet.</p>
                  )}
              </div>
          </div>
      </main>
    </div>
  );
};

export default ManageOnlineHistoryScreen;
