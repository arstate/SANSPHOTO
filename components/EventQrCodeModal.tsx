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
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-3xl text-center mb-1">QR Code Settings</h2>
        <p className="text-center text-purple-300 font-bold text-xl mb-6">{event.name}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="qrCodeImageUrl" className="block text-sm font-bold mb-2 text-gray-300">QR Code Image URL</label>
            <p className="text-xs text-gray-500 mb-2">Use a direct image link. For Google Photos, use the embed link.</p>
            <input
              id="qrCodeImageUrl"
              name="qrCodeImageUrl"
              type="url"
              value={qrCodeImageUrl}
              onChange={(e) => setQrCodeImageUrl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://..."
            />
          </div>

          <div>
             <label htmlFor="isQrCodeEnabled" className="flex items-center justify-between cursor-pointer">
                <div>
                    <span className="block text-sm font-medium text-gray-300">Show QR Code on Preview</span>
                    <p className="text-xs text-gray-500">If enabled, this QR code will be shown after the photo session.</p>
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
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" className="flex-1 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-full text-lg">
              Save Settings
            </button>
            <button type="button" onClick={onClose} className="flex-1 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventQrCodeModal;
