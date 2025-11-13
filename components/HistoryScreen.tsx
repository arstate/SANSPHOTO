
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
    <div className="relative flex flex-col w-full min-h-screen p-4">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-white">Photobooth History</h2>
      </header>
      
      <div className="w-full max-w-md mx-auto mb-6">
          <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-300 mb-2">Filter by Event</label>
          <select
            id="eventFilter"
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Events</option>
            {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
      </div>


      <main className="w-full max-w-6xl mx-auto">
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredHistory.map(entry => (
              <div key={entry.id} className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex flex-col">
                <img src={entry.imageDataUrl} alt={`Photo from ${entry.eventName}`} className="w-full aspect-[2/3] object-cover rounded-md" />
                <div className="mt-2 text-center">
                  <p className="font-bold text-white">{entry.eventName}</p>
                  <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-center gap-4">
                    <button
                        onClick={() => handleDownload(entry.imageDataUrl, `sans-photo-${entry.timestamp}.png`)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg transition-transform transform hover:scale-110"
                        aria-label="Download Photo"
                    >
                        <DownloadIcon />
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg transition-transform transform hover:scale-110"
                        aria-label="Delete History Entry"
                    >
                        <TrashIcon />
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-16">
            <p>No history found for the selected filter.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;
