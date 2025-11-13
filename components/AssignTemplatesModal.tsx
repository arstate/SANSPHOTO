import React, { useState, useMemo } from 'react';
import { Event, Template } from '../types';

interface AssignTemplatesModalProps {
  event: Event;
  allTemplates: Template[];
  onSave: (eventId: string, assignedTemplateIds: string[]) => void;
  onClose: () => void;
}

const AssignTemplatesModal: React.FC<AssignTemplatesModalProps> = ({ event, allTemplates, onSave, onClose }) => {
  const [assignedIds, setAssignedIds] = useState<string[]>(() => 
    allTemplates.filter(t => t.eventId === event.id).map(t => t.id)
  );

  const { assigned, available } = useMemo(() => {
    const assigned: Template[] = [];
    const available: Template[] = [];
    allTemplates.forEach(t => {
      if (assignedIds.includes(t.id)) {
        assigned.push(t);
      } else if (!t.eventId || t.eventId === event.id) { // Show unassigned or those previously assigned to this event
        available.push(t);
      }
    });
    return { assigned, available };
  }, [allTemplates, assignedIds, event.id]);
  
  const handleAssign = (templateId: string) => {
    setAssignedIds(prev => [...prev, templateId]);
  };
  
  const handleUnassign = (templateId: string) => {
    setAssignedIds(prev => prev.filter(id => id !== templateId));
  };
  
  const handleSave = () => {
    onSave(event.id, assignedIds);
  };
  
  const TemplateItem: React.FC<{template: Template, action: 'assign' | 'unassign'}> = ({ template, action }) => (
    <div className="bg-gray-700 p-2 rounded-md flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
            <img src={template.imageUrl} alt={template.name} className="w-8 h-12 object-cover rounded-sm" />
            <span>{template.name}</span>
        </div>
        <button 
            onClick={() => action === 'assign' ? handleAssign(template.id) : handleUnassign(template.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${action === 'assign' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
            {action === 'assign' ? 'Add' : 'Remove'}
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="font-bebas text-3xl text-center mb-1">Assign Templates</h2>
        <p className="text-center text-purple-300 font-bold text-xl mb-4">{event.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
          {/* Assigned Templates */}
          <div className="bg-gray-900/50 p-3 rounded-lg flex flex-col">
            <h3 className="font-bold text-center mb-2 text-green-400">Assigned Templates ({assigned.length})</h3>
            <div className="space-y-2 overflow-y-auto flex-grow">
              {assigned.length > 0 ? assigned.map(t => <TemplateItem key={t.id} template={t} action="unassign" />) : <p className="text-gray-500 text-center pt-8">No templates assigned.</p>}
            </div>
          </div>

          {/* Available Templates */}
          <div className="bg-gray-900/50 p-3 rounded-lg flex flex-col">
            <h3 className="font-bold text-center mb-2 text-yellow-400">Available Templates ({available.length})</h3>
            <div className="space-y-2 overflow-y-auto flex-grow">
              {available.length > 0 ? available.map(t => <TemplateItem key={t.id} template={t} action="assign" />) : <p className="text-gray-500 text-center pt-8">No available templates.</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-gray-700">
          <button onClick={handleSave} className="flex-1 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-full text-lg">
            Save Changes
          </button>
          <button onClick={onClose} className="flex-1 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-full text-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTemplatesModal;