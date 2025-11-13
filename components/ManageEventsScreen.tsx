
import React, { useState } from 'react';
import { Event } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { UnarchiveIcon } from './icons/UnarchiveIcon';
import { LinkIcon } from './icons/LinkIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';

interface ManageEventsScreenProps {
  events: Event[];
  onBack: () => void;
  onAddEvent: (name: string) => void;
  onRenameEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleArchive: (eventId: string) => void;
  onAssignTemplates: (event: Event) => void;
  onQrCodeSettings: (event: Event) => void;
}

const ManageEventsScreen: React.FC<ManageEventsScreenProps> = ({
  events, onBack, onAddEvent, onRenameEvent, onDeleteEvent, onToggleArchive, onAssignTemplates, onQrCodeSettings
}) => {
  const [newEventName, setNewEventName] = useState('');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEventName.trim()) {
      onAddEvent(newEventName.trim());
      setNewEventName('');
    }
  };

  const activeEvents = events.filter(e => !e.isArchived);
  const archivedEvents = events.filter(e => e.isArchived);

  const EventItem: React.FC<{event: Event}> = ({ event }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700">
        <button onClick={() => onRenameEvent(event)} className="hover:text-purple-400">
            <span className="font-bold text-lg">{event.name}</span>
        </button>
        <div className="flex items-center gap-2">
            <button onClick={() => onQrCodeSettings(event)} className="text-gray-400 hover:text-white p-2" aria-label="QR Code Settings"><QrCodeIcon /></button>
            <button onClick={() => onAssignTemplates(event)} className="text-gray-400 hover:text-white p-2" aria-label="Assign Templates"><LinkIcon /></button>
            <button onClick={() => onToggleArchive(event.id)} className="text-gray-400 hover:text-white p-2" aria-label={event.isArchived ? "Unarchive" : "Archive"}>
                {event.isArchived ? <UnarchiveIcon/> : <ArchiveIcon />}
            </button>
            <button onClick={() => onDeleteEvent(event.id)} className="text-gray-400 hover:text-red-500 p-2" aria-label="Delete Event"><TrashIcon /></button>
        </div>
    </div>
  );

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
        <h2 className="text-4xl font-bebas tracking-wider text-white">Manage Events</h2>
      </header>

      <main className="w-full max-w-2xl mx-auto space-y-8 overflow-y-auto scrollbar-thin pr-2">
        <div>
            <h3 className="text-2xl font-bebas tracking-wider text-purple-400 mb-4">Add New Event</h3>
            <form onSubmit={handleAddEvent} className="flex gap-2">
                <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="Enter new event name"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md flex items-center gap-2">
                    <AddIcon /> Add
                </button>
            </form>
        </div>
        
        <div>
            <h3 className="text-2xl font-bebas tracking-wider text-purple-400 mb-4">Active Events</h3>
            <div className="space-y-3">
                {activeEvents.length > 0 ? activeEvents.map(event => (
                    <EventItem key={event.id} event={event} />
                )) : <p className="text-gray-500 text-center py-4">No active events.</p>}
            </div>
        </div>

        {archivedEvents.length > 0 && (
            <div>
                <h3 className="text-2xl font-bebas tracking-wider text-gray-500 mb-4">Archived Events</h3>
                <div className="space-y-3 opacity-60">
                    {archivedEvents.map(event => (
                        <EventItem key={event.id} event={event} />
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default ManageEventsScreen;
