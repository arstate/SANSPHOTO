
import React, { useState, useMemo } from 'react';
import { Event, Template } from '../types';

interface AssignTemplatesModalProps {
  event: Event;
  allTemplates: Template[];
  onSave: (eventId: string, assignedTemplateIds: string[]) => void;
  onClose: () => void;
}

const AssignTemplatesModal: React.FC<AssignTemplatesModalProps> = ({ event, allTemplates, onSave, onClose }) => {
  const [assignedIds, setAssignedIds] = useState<string[]>(() => {
    if (event.templateOrder) {
        // Filter untuk memastikan hanya template yang masih ada yang disertakan
        const existingTemplateIds = new Set(allTemplates.map(t => t.id));
        return event.templateOrder.filter(id => existingTemplateIds.has(id));
    }
    // Fallback untuk event yang dibuat sebelum fitur ini ada
    return allTemplates
        .filter(t => t.eventId === event.id)
        .sort((a, b) => a.name.localeCompare(b.name)) // Urutkan berdasarkan abjad untuk konsistensi
        .map(t => t.id);
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { assigned, available } = useMemo(() => {
    const allTemplatesMap = new Map(allTemplates.map(t => [t.id, t]));
    
    const assigned: Template[] = assignedIds
      .map(id => allTemplatesMap.get(id))
      .filter((t): t is Template => !!t);

    const available: Template[] = allTemplates.filter(t => 
        !assignedIds.includes(t.id) && 
        (!t.eventId || t.eventId === event.id)
    ).sort((a,b) => a.name.localeCompare(b.name));
    
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.effectAllowed = 'move';
      setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (draggedId && draggedId !== id) {
          setDragOverId(id);
      }
  };

  const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
      e.preventDefault();
      if (draggedId && draggedId !== dropTargetId) {
          const draggedIndex = assignedIds.indexOf(draggedId);
          const targetIndex = assignedIds.indexOf(dropTargetId);

          if (draggedIndex > -1 && targetIndex > -1) {
              const newAssignedIds = [...assignedIds];
              const [removed] = newAssignedIds.splice(draggedIndex, 1);
              newAssignedIds.splice(targetIndex, 0, removed);
              setAssignedIds(newAssignedIds);
          }
      }
      setDraggedId(null);
      setDragOverId(null);
  };

  const handleDragEnd = () => {
      setDraggedId(null);
      setDragOverId(null);
  };
  
  interface TemplateItemProps {
    template: Template;
    action: 'assign' | 'unassign';
  }

  const TemplateItem: React.FC<TemplateItemProps> = ({ template, action }) => (
    <div className="bg-[var(--color-bg-tertiary)] p-2 rounded-md flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
            <img src={template.imageUrl} alt={template.name} className="w-8 h-12 object-cover rounded-sm" />
            <span>{template.name}</span>
        </div>
        <button 
            onClick={() => action === 'assign' ? handleAssign(template.id) : handleUnassign(template.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${action === 'assign' ? 'bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)]' : 'bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)]'}`}
        >
            {action === 'assign' ? 'Add' : 'Remove'}
        </button>
    </div>
  );

  const DraggableTemplateItem: React.FC<TemplateItemProps> = ({ template, action }) => {
    const isBeingDragged = draggedId === template.id;
    const isDragOver = dragOverId === template.id;
    
    let containerClass = "bg-[var(--color-bg-tertiary)] p-2 rounded-md flex items-center justify-between text-sm transition-all duration-150 relative cursor-grab";
    if (isBeingDragged) containerClass += " opacity-30";
    
    return (
      <div 
        className={containerClass}
        draggable
        onDragStart={(e) => handleDragStart(e, template.id)}
        onDragEnter={(e) => handleDragEnter(e, template.id)}
        onDrop={(e) => handleDrop(e, template.id)}
      >
        {isDragOver && <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-accent-primary)] rounded-full -mt-1" />}
        <div className="flex items-center gap-2 pointer-events-none">
          <img src={template.imageUrl} alt={template.name} className="w-8 h-12 object-cover rounded-sm" />
          <span>{template.name}</span>
        </div>
        <button 
          onClick={() => handleUnassign(template.id)}
          className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)]"
        >
          Remove
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-3xl border border-[var(--color-border-primary)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="font-bebas text-3xl text-center mb-1">Assign Templates</h2>
        <p className="text-center text-[var(--color-text-accent)] font-bold text-xl mb-4">{event.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
          {/* Assigned Templates */}
          <div className="bg-[var(--color-bg-primary)]/50 p-3 rounded-lg flex flex-col">
            <h3 className="font-bold text-center mb-2 text-green-400">Assigned Templates ({assigned.length})</h3>
            <div className="space-y-2 overflow-y-auto flex-grow pr-1" onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              {assigned.length > 0 ? assigned.map(t => 
                <DraggableTemplateItem key={t.id} template={t} action="unassign" />
              ) : <p className="text-[var(--color-text-muted)] text-center pt-8">Drag templates here to assign.</p>}
            </div>
          </div>

          {/* Available Templates */}
          <div className="bg-[var(--color-bg-primary)]/50 p-3 rounded-lg flex flex-col">
            <h3 className="font-bold text-center mb-2 text-yellow-400">Available Templates ({available.length})</h3>
            <div className="space-y-2 overflow-y-auto flex-grow pr-1">
              {available.length > 0 ? available.map(t => <TemplateItem key={t.id} template={t} action="assign" />) : <p className="text-[var(--color-text-muted)] text-center pt-8">No available templates.</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-[var(--color-border-primary)]">
          <button onClick={handleSave} className="flex-1 w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg">
            Save Changes
          </button>
          <button onClick={onClose} className="flex-1 w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTemplatesModal;