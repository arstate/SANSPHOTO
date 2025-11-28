
import React, { useState, useMemo } from 'react';
import { SessionKey, SessionKeyStatus } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { CloseIcon } from './icons/CloseIcon';
import { DownloadIcon } from './icons/DownloadIcon';

// Declare QRCode global from CDN
declare const QRCode: any;

interface ManageSessionsScreenProps {
  sessionKeys: SessionKey[];
  onBack: () => void;
  onAddKey: (maxTakes: number, isUnlimited?: boolean) => void;
  onDeleteKey: (keyId: string) => void;
  onDeleteAllKeys: () => void;
  onDeleteFreeplayKeys: () => void;
}

interface QrPreviewModalProps {
  sessionKey: SessionKey;
  onClose: () => void;
}

const QrPreviewModal: React.FC<QrPreviewModalProps> = ({ sessionKey, onClose }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (typeof QRCode !== 'undefined') {
            QRCode.toDataURL(sessionKey.code, { width: 500, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err: any, url: string) => {
                if (!err) setQrDataUrl(url);
            });
        }
    }, [sessionKey.code]);

    const handleDownload = () => {
        if (!qrDataUrl) return;

        const canvas = document.createElement('canvas');
        // Fix Chrome Android Aw Snap
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const width = 600;
        const height = 800;
        
        if (ctx) {
            canvas.width = width;
            canvas.height = height;

            // 1. White Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. Header Text: SANS PHOTO
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 80px "Bebas Neue", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SANS PHOTO', width / 2, 120);

            // 3. Draw QR Code
            const qrImg = new Image();
            qrImg.onload = () => {
                const qrSize = 400;
                const qrX = (width - qrSize) / 2;
                const qrY = 180;
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                // 4. Session Code Label
                ctx.font = '40px "Poppins", sans-serif';
                ctx.fillStyle = '#555555';
                ctx.fillText('Session Code', width / 2, 650);

                // 5. Session Code Value
                ctx.font = 'bold 60px "Courier New", monospace';
                ctx.fillStyle = '#000000';
                ctx.fillText(sessionKey.code, width / 2, 720);

                // 6. Download
                const finalUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = finalUrl;
                link.download = `SANS-PHOTO-SESSION-${sessionKey.code}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
            qrImg.src = qrDataUrl;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl p-6 w-full max-w-md border border-[var(--color-border-primary)] relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                    <CloseIcon />
                </button>
                
                <h3 className="text-3xl font-bebas text-[var(--color-text-primary)] mb-1">Session QR</h3>
                <p className="text-[var(--color-text-accent)] font-mono text-2xl font-bold tracking-widest mb-6">{sessionKey.code}</p>

                <div className="bg-white p-4 rounded-lg mb-6">
                   {qrDataUrl ? (
                       <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                   ) : (
                       <div className="w-64 h-64 flex items-center justify-center text-black">Generating...</div>
                   )}
                </div>

                <button 
                    onClick={handleDownload}
                    disabled={!qrDataUrl}
                    className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DownloadIcon /> Download PNG
                </button>
            </div>
        </div>
    );
}

const getStatusClass = (status: SessionKeyStatus, isUnlimited?: boolean) => {
    if (isUnlimited) return 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-purple-500/20 shadow-md';
    switch (status) {
        case 'available': return 'bg-green-600/30 text-green-300 border-green-500';
        case 'in_progress': return 'bg-yellow-600/30 text-yellow-300 border-yellow-500';
        case 'completed': return 'bg-gray-600/30 text-gray-400 border-gray-500';
        default: return 'bg-gray-700';
    }
}

const ManageSessionsScreen: React.FC<ManageSessionsScreenProps> = ({ sessionKeys, onBack, onAddKey, onDeleteKey, onDeleteAllKeys, onDeleteFreeplayKeys }) => {
  const [maxTakes, setMaxTakes] = useState(1);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [selectedQrKey, setSelectedQrKey] = useState<SessionKey | null>(null);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (maxTakes > 0) {
      onAddKey(maxTakes, isUnlimited);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  const handleCopyAll = () => {
    const availableKeys = sessionKeys.filter(k => k.status === 'available' || k.isUnlimited).map(k => k.code).join('\n');
    if (availableKeys) {
        navigator.clipboard.writeText(availableKeys);
        setAllCopied(true);
        setTimeout(() => setAllCopied(false), 2000);
    } else {
        alert('No available codes to copy.');
    }
  };
  
  const sortedKeys = useMemo(() => {
    // Filter out keys that were auto-generated from unlimited keys to keep the list clean
    const displayKeys = sessionKeys.filter(k => !k.isGenerated);

    return [...displayKeys].sort((a, b) => {
        // Unlimited keys first
        if (a.isUnlimited && !b.isUnlimited) return -1;
        if (!a.isUnlimited && b.isUnlimited) return 1;
        // Prioritaskan sesi 'in_progress' di atas
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
        // Kemudian urutkan berdasarkan waktu pembuatan terbaru
        return b.createdAt - a.createdAt;
    });
  }, [sessionKeys]);

  return (
    <>
    {selectedQrKey && (
        <QrPreviewModal sessionKey={selectedQrKey} onClose={() => setSelectedQrKey(null)} />
    )}
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
              <form onSubmit={handleAddKey} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
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
                  </div>
                  <div className="flex items-center justify-between">
                      <label htmlFor="isUnlimited" className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="isUnlimited"
                                checked={isUnlimited}
                                onChange={(e) => setIsUnlimited(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Unlimited / Multi-device Mode</span>
                            <span className="text-xs text-[var(--color-text-muted)]">Code stays active until deleted. Allows simultaneous use on multiple devices.</span>
                        </div>
                      </label>
                  </div>
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
                      <div key={key.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${getStatusClass(key.status, key.isUnlimited)}`}>
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
                                      <div className="flex items-center gap-2">
                                        {key.isUnlimited ? (
                                             <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-bold border border-purple-500/30 uppercase">
                                                Unlimited Code
                                             </span>
                                        ) : (
                                            <p className="font-bold text-[var(--color-text-primary)]">Takes: {key.takesUsed} / {key.maxTakes}</p>
                                        )}
                                      </div>
                                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Created: {new Date(key.createdAt).toLocaleString()}</p>
                                  </div>
                              </div>
                              {key.status === 'in_progress' && !key.isUnlimited && (
                                  <div className="mt-2 pt-2 border-t border-yellow-500/30">
                                      <p className="text-sm font-semibold text-yellow-200">{key.currentEventName || '...'}</p>
                                      <p className="text-sm text-yellow-100 animate-pulse">{key.progress || '...'}</p>
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-center">
                              {!key.isUnlimited && (
                                <span className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-full bg-opacity-80`}>
                                    {(key.status || 'unknown').replace('_', ' ')}
                                </span>
                              )}
                              <button onClick={() => setSelectedQrKey(key)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-2" aria-label="View QR">
                                  <QrCodeIcon />
                              </button>
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
    </>
  );
};

export default ManageSessionsScreen;
