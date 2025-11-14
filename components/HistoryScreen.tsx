
import React, { useState, useMemo, useCallback } from 'react';
import { HistoryEntry, Event } from '../types';
import { BackIcon } from './icons/BackIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface HistoryScreenProps {
  history: HistoryEntry[];
  events: Event[];
  onDelete: (entryId: string) => void;
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, events, onDelete, onBack }) => {
  const [filterEventId, setFilterEventId] = useState<string>('all');

  const filteredHistory = useMemo(() => {
    if (filterEventId === 'all') {
      return history;
    }
    return history.filter(entry => entry.eventId === filterEventId);
  }, [history, filterEventId]);
  
  const handleDownload = useCallback((imageDataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Photobooth History</h2>
      </header>
      
      <div className="w-full max-w-md mx-auto mb-6 shrink-0">
          <label htmlFor="eventFilter" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Filter by Event</label>
          <select
            id="eventFilter"
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
          >
            <option value="all">All Events</option>
            {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
      </div>


      <main className="w-full max-w-6xl mx-auto overflow-y-auto scrollbar-thin pr-2">
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredHistory.map(entry => (
              <div key={entry.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-2 flex flex-col">
                <img src={entry.imageDataUrl} alt={`Photo from ${entry.eventName}`} className="w-full aspect-[2/3] object-cover rounded-md" />
                <div className="mt-2 text-center">
                  <p className="font-bold text-[var(--color-text-primary)]">{entry.eventName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--color-border-primary)] flex items-center justify-center gap-4">
                    <button
                        onClick={() => handleDownload(entry.imageDataUrl, `sans-photo-${entry.timestamp}.png`)}
                        className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold p-3 rounded-lg transition-transform transform hover:scale-110"
                        aria-label="Download Photo"
                    >
                        <DownloadIcon />
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)] font-bold p-3 rounded-lg transition-transform transform hover:scale-110"
                        aria-label="Delete History Entry"
                    >
                        <TrashIcon />
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-16">
            <p>No history found for the selected filter.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;