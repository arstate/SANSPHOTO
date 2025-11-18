import React, { useState, useMemo } from 'react';
import { SessionKey, SessionKeyStatus } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';


interface ManageSessionsScreenProps {
  sessionKeys: SessionKey[];
  onBack: () => void;
  onAddKey: (maxTakes: number) => void;
  onDeleteKey: (keyId: string) => void;
  onDeleteAllKeys: () => void;
  onDeleteFreeplayKeys: () => void;
}

const getStatusClass = (status: SessionKeyStatus) => {
    switch (status) {
        case 'available': return 'bg-green-600/30 text-green-300 border-green-500';
        case 'in_progress': return 'bg-yellow-600/30 text-yellow-300 border-yellow-500';
        case 'completed': return 'bg-gray-600/30 text-gray-400 border-gray-500';
        default: return 'bg-gray-700';
    }
}

const ManageSessionsScreen: React.FC<ManageSessionsScreenProps> = ({ sessionKeys, onBack, onAddKey, onDeleteKey, onDeleteAllKeys, onDeleteFreeplayKeys }) => {
  const [maxTakes, setMaxTakes] = useState(1);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (maxTakes > 0) {
      onAddKey(maxTakes);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  const handleCopyAll = () => {
    const availableKeys = sessionKeys.filter(k => k.status === 'available').map(k => k.code).join('\n');
    if (availableKeys) {
        navigator.clipboard.writeText(availableKeys);
        setAllCopied(true);
        setTimeout(() => setAllCopied(false), 2000);
    } else {
        alert('No available codes to copy.');
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
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Manage Session Codes</h2>
      </header>
      
      <main className="w-full max-w-2xl mx-auto flex flex-col min-h-0">
          {/* Add New Key Form */}
          <div className="shrink-0 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg mb-6">
              <h3 className="text-2xl font-bebas tracking-wider text-[var(--color-text-accent)] mb-4">Generate New Code</h3>
              <form onSubmit={handleAddKey} className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-grow w-full">
                      <label htmlFor="maxTakes" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Number of Takes</label>
                      <input
                          type="number"
                          id="maxTakes"
                          value={maxTakes}
                          onChange={(e) => setMaxTakes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          min="1"
                          className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                      />
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2">
                      <AddIcon /> Generate
                  </button>
              </form>
          </div>
          
           {/* Bulk Actions */}
          <div className="shrink-0 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg mb-6">
            <h3 className="text-2xl font-bebas tracking-wider text-[var(--color-text-accent)] mb-4">Bulk Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button onClick={handleCopyAll} className={`font-bold py-2 px-4 rounded-md transition-colors ${allCopied ? 'bg-green-600 text-white' : 'bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)]'}`}>
                {allCopied ? 'Copied!' : 'Copy All Available'}
              </button>
              <button onClick={onDeleteFreeplayKeys} className="font-bold py-2 px-4 rounded-md bg-[var(--color-negative)]/80 hover:bg-[var(--color-negative)] text-[var(--color-negative-text)]">
                Delete All Freeplay
              </button>
              <button onClick={onDeleteAllKeys} className="font-bold py-2 px-4 rounded-md bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)]">
                Delete All Codes
              </button>
            </div>
          </div>


          {/* Session Keys List */}
          <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
              <div className="space-y-3">
                  {sortedKeys.length > 0 ? sortedKeys.map(key => (
                      <div key={key.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${getStatusClass(key.status)}`}>
                          <div className="flex-grow">
                              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                  <span 
                                    className="font-mono text-3xl font-bold tracking-widest text-[var(--color-text-accent)] bg-[var(--color-bg-primary)]/50 px-4 py-2 rounded-md cursor-pointer hover:bg-[var(--color-bg-primary)] transition-colors"
                                    onClick={() => handleCopy(key.code, key.id)}
                                    title="Click to copy"
                                  >
                                    {key.code}
                                  </span>
                                  <div>
                                      <p className="font-bold text-[var(--color-text-primary)]">Takes: {key.takesUsed} / {key.maxTakes}</p>
                                      <p className="text-xs text-[var(--color-text-muted)]">Created: {new Date(key.createdAt).toLocaleString()}</p>
                                  </div>
                              </div>
                              {key.status === 'in_progress' && (
                                  <div className="mt-2 pt-2 border-t border-yellow-500/30">
                                      <p className="text-sm font-semibold text-yellow-200">{key.currentEventName || '...'}</p>
                                      <p className="text-sm text-yellow-100 animate-pulse">{key.progress || '...'}</p>
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-center">
                              <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full bg-opacity-80`}>
                                {(key.status || 'unknown').replace('_', ' ')}
                              </span>
                              <button onClick={() => handleCopy(key.code, key.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-2" aria-label="Copy Code">
                                {copySuccessId === key.id ? <CheckIcon/> : <CopyIcon />}
                              </button>
                              <button onClick={() => onDeleteKey(key.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-negative)] p-2" aria-label="Delete Key">
                                  <TrashIcon />
                              </button>
                          </div>
                      </div>
                  )) : <p className="text-[var(--color-text-muted)] text-center py-12">No session codes generated yet.</p>}
              </div>
          </div>
      </main>
    </div>
  );
};

export default ManageSessionsScreen;