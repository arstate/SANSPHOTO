import React, { useState } from 'react';

interface AddOnlineHistoryModalProps {
  onSave: (urls: string[]) => void;
  onClose: () => void;
  isSaving: boolean;
}

const AddOnlineHistoryModal: React.FC<AddOnlineHistoryModalProps> = ({ onSave, onClose, isSaving }) => {
  const [urls, setUrls] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlArray = urls.split('\n').map(url => url.trim()).filter(url => url.startsWith('http'));
    if (urlArray.length > 0) {
      onSave(urlArray);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-lg border border-[var(--color-border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-4">Add Photos to Online History</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="urls" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Google Photos Image URLs</label>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Paste one or more direct image URLs (from Google Photos, usually starting with `lh3.googleusercontent.com`), each on a new line.</p>
            <textarea
              id="urls"
              name="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full h-40 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] scrollbar-thin"
              placeholder="https://lh3.googleusercontent.com/pw/..."
              required
            />
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <button type="submit" disabled={isSaving} className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-4 rounded-full text-lg disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait">
              {isSaving ? 'Saving...' : 'Save Photos'}
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOnlineHistoryModal;
