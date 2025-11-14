import React, { useState } from 'react';
import { Event } from '../types';

interface RenameEventModalProps {
  event: Event;
  onSave: (eventId: string, newName: string) => void;
  onClose: () => void;
}

const RenameEventModal: React.FC<RenameEventModalProps> = ({ event, onSave, onClose }) => {
  const [name, setName] = useState(event.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(event.id, name.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-sm border border-[var(--color-border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-6">Rename Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="eventName" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Event Name</label>
            <input
              id="eventName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required
            />
          </div>
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg">
              Save Name
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

export default RenameEventModal;