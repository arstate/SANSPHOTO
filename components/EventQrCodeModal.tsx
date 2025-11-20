
import React, { useState, useEffect, useRef } from 'react';
import { Event } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

// Declare QRCode global from CDN
declare const QRCode: any;

interface EventQrCodeModalProps {
  event: Event;
  onSave: (eventId: string, settings: { qrCodeValue?: string, isQrCodeEnabled?: boolean }) => void;
  onClose: () => void;
}

const EventQrCodeModal: React.FC<EventQrCodeModalProps> = ({ event, onSave, onClose }) => {
  const [qrCodeValue, setQrCodeValue] = useState(event.qrCodeValue || '');
  const [isQrCodeEnabled, setIsQrCodeEnabled] = useState(event.isQrCodeEnabled || false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate QR preview when value changes
  useEffect(() => {
    if (qrCodeValue.trim() && typeof QRCode !== 'undefined') {
        QRCode.toDataURL(qrCodeValue, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err: any, url: string) => {
            if (!err) setPreviewUrl(url);
            else setPreviewUrl(null);
        });
    } else {
        setPreviewUrl(null);
    }
  }, [qrCodeValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(event.id, { qrCodeValue, isQrCodeEnabled });
  };

  const handleDownloadQr = () => {
      if (!previewUrl) return;
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `QR-${event.name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            <label htmlFor="qrCodeValue" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Destination Link / URL</label>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Enter the link you want users to visit when they scan the code.</p>
            <input
              id="qrCodeValue"
              name="qrCodeValue"
              type="text"
              value={qrCodeValue}
              onChange={(e) => setQrCodeValue(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              placeholder="https://..."
            />
          </div>

           {/* Preview Section */}
           {previewUrl && (
              <div className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)] mb-2">Preview</p>
                  <img src={previewUrl} alt="QR Preview" className="w-40 h-40 border-4 border-white rounded-sm mb-3" />
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="text-sm bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] px-4 py-2 rounded-full flex items-center gap-2"
                  >
                      <DownloadIcon /> Download QR
                  </button>
              </div>
          )}

          <div>
             <label htmlFor="isQrCodeEnabled" className="flex items-center justify-between cursor-pointer">
                <div>
                    <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show QR Code on Result Screen</span>
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
