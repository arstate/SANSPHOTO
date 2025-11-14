import React, { useState, useMemo } from 'react';
import { SessionKey, SessionKeyStatus } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ManageSessionsScreenProps {
  sessionKeys: SessionKey[];
  onBack: () => void;
  onAddKey: (maxTakes: number) => void;
  onDeleteKey: (keyId: string) => void;
}

const getStatusClass = (status: SessionKeyStatus) => {
    switch (status) {
        case 'available': return 'bg-green-600/30 text-green-300 border-green-500';
        case 'in_progress': return 'bg-yellow-600/30 text-yellow-300 border-yellow-500';
        case 'completed': return 'bg-gray-600/30 text-gray-400 border-gray-500';
        default: return 'bg-gray-700';
    }
}

const ManageSessionsScreen: React.FC<ManageSessionsScreenProps> = ({ sessionKeys, onBack, onAddKey, onDeleteKey }) => {
  const [maxTakes, setMaxTakes] = useState(1);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (maxTakes > 0) {
      onAddKey(maxTakes);
    }
  };
  
  const sortedKeys = useMemo(() => {
    return [...sessionKeys].sort((a, b) => {
        // Prioritaskan sesi 'in_progress' di atas
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
        // Kemudian urutkan berdasarkan waktu pembuatan terbaru
        return b.createdAt - a.createdAt;
    });
  }, [sessionKeys]);

  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-white">Manage Session Codes</h2>
      </header>
      
      <main className="w-full max-w-2xl mx-auto flex flex-col min-h-0">
          {/* Add New Key Form */}
          <div className="shrink-0 p-4 bg-gray-800 border border-gray-700 rounded-lg mb-6">
              <h3 className="text-2xl font-bebas tracking-wider text-purple-400 mb-4">Generate New Code</h3>
              <form onSubmit={handleAddKey} className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-grow w-full">
                      <label htmlFor="maxTakes" className="block text-sm font-medium text-gray-300 mb-1">Number of Takes</label>
                      <input
                          type="number"
                          id="maxTakes"
                          value={maxTakes}
                          onChange={(e) => setMaxTakes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          min="1"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2">
                      <AddIcon /> Generate
                  </button>
              </form>
          </div>
          
          {/* Session Keys List */}
          <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
              <div className="space-y-3">
                  {sortedKeys.length > 0 ? sortedKeys.map(key => (
                      <div key={key.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${getStatusClass(key.status)}`}>
                          <div className="flex-grow">
                              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                  <span className="font-mono text-3xl font-bold tracking-widest text-purple-300 bg-gray-900/50 px-4 py-2 rounded-md">{key.code}</span>
                                  <div>
                                      <p className="font-bold text-white">Takes: {key.takesUsed} / {key.maxTakes}</p>
                                      <p className="text-xs text-gray-400">Created: {new Date(key.createdAt).toLocaleString()}</p>
                                  </div>
                              </div>
                              {key.status === 'in_progress' && (
                                  <div className="mt-2 pt-2 border-t border-yellow-500/30">
                                      <p className="text-sm font-semibold text-yellow-200">{key.currentEventName || '...'}</p>
                                      <p className="text-sm text-yellow-100 animate-pulse">{key.progress || '...'}</p>
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className={`px-3 py-1 text-sm font-bold rounded-full bg-opacity-80`}>
                                {key.status.replace('_', ' ')}
                              </span>
                              <button onClick={() => onDeleteKey(key.id)} className="text-gray-400 hover:text-red-500 p-2" aria-label="Delete Key">
                                  <TrashIcon />
                              </button>
                          </div>
                      </div>
                  )) : <p className="text-gray-500 text-center py-12">No session codes generated yet.</p>}
              </div>
          </div>
      </main>
    </div>
  );
};

export default ManageSessionsScreen;