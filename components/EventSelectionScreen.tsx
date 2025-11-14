
import React from 'react';
import { Event } from '../types';
import { BackIcon } from './icons/BackIcon';

interface EventSelectionScreenProps {
  events: Event[];
  onSelect: (eventId: string) => void;
  onBack: () => void;
}

const EventSelectionScreen: React.FC<EventSelectionScreenProps> = ({ events, onSelect, onBack }) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className="absolute top-4 left-4">
            <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
            >
            <BackIcon />
            </button>
        </div>

        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-8">Choose Your Event</h2>
        
        <div className="w-full max-w-sm space-y-4">
            {events.length > 0 ? (
                events.map(event => (
                    <button
                        key={event.id}
                        onClick={() => onSelect(event.id)}
                        className="w-full text-left bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-primary)]/20 border-2 border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)] p-6 rounded-lg transition-all transform hover:scale-105"
                    >
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{event.name}</h3>
                    </button>
                ))
            ) : (
                <div className="text-center text-[var(--color-text-muted)] p-8 bg-[var(--color-bg-secondary)] rounded-lg">
                    <p>No active events at the moment. Please check back later!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default EventSelectionScreen;