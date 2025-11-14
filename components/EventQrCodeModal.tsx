import React, { useState } from 'react';
import { Event } from '../types';

interface EventQrCodeModalProps {
  event: Event;
  onSave: (eventId: string, settings: { qrCodeImageUrl?: string, isQrCodeEnabled?: boolean }) => void;
  onClose: () => void;
}

const EventQrCodeModal: React.FC<EventQrCodeModalProps> = ({ event, onSave, onClose }) => {
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(event.qrCodeImageUrl || '');
  const [isQrCodeEnabled, setIsQrCodeEnabled] = useState(event.isQrCodeEnabled || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(event.id, { qrCodeImageUrl, isQrCodeEnabled });
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
        <h2 className="font-bebas text-3xl text-center mb-1">QR Code Settings</h2>
        <p className="text-center text-[var(--color-text-accent)] font-bold text-xl mb-6">{event.name}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="qrCodeImageUrl" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">QR Code Image URL</label>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Use a direct image link. For Google Photos, use the embed link.</p>
            <input
              id="qrCodeImageUrl"
              name="qrCodeImageUrl"
              type="url"
              value={qrCodeImageUrl}
              onChange={(e) => setQrCodeImageUrl(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              placeholder="https://..."
            />
          </div>

          <div>
             <label htmlFor="isQrCodeEnabled" className="flex items-center justify-between cursor-pointer">
                <div>
                    <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show QR Code on Preview</span>
                    <p className="text-xs text-[var(--color-text-muted)]">If enabled, this QR code will be shown after the photo session.</p>
                </div>
                <div className="relative">
                    <input
                        type="checkbox"
                        id="isQrCodeEnabled"
                        name="isQrCodeEnabled"
                        checked={isQrCodeEnabled}
                        onChange={(e) => setIsQrCodeEnabled(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" className="flex-1 w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg">
              Save Settings
            </button>
            <button type="button" onClick={onClose} className="flex-1 w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventQrCodeModal;