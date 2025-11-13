import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoSlot, Template } from '../types';

const TEMPLATE_WIDTH = 1000;
const TEMPLATE_HEIGHT = 1500;

const DEFAULT_SLOTS: PhotoSlot[] = [
  { id: 1, inputId: 1, x: 90,  y: 70,   width: 480, height: 480 },
  { id: 2, inputId: 1, x: 630, y: 70,   width: 480, height: 480 },
  { id: 3, inputId: 2, x: 90,  y: 610,  width: 480, height: 480 },
  { id: 4, inputId: 2, x: 630, y: 610,  width: 480, height: 480 },
  { id: 5, inputId: 3, x: 90,  y: 1150, width: 480, height: 480 },
  { id: 6, inputId: 3, x: 630, y: 1150, width: 480, height: 480 },
];


interface EditTemplateScreenProps {
  template: Template;
  onSave: (newSlots: PhotoSlot[]) => void;
  onCancel: () => void;
}

type EditAction = 'drag' | 'resize-br';
interface EditingState {
  action: EditAction;
  slotId: number;
  startX: number;
  startY: number;
  startSlotX: number;
  startSlotY: number;
  startSlotWidth: number;
  startSlotHeight: number;
}

const EditTemplateScreen: React.FC<EditTemplateScreenProps> = ({ template, onSave, onCancel }) => {
  const [slots, setSlots] = useState<PhotoSlot[]>(template.photoSlots);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1);

  const selectedSlot = selectedSlotId !== null ? slots.find(s => s.id === selectedSlotId) : null;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const aspectRatio = template.widthMM / template.heightMM;
        scaleRef.current = containerRef.current.offsetWidth / TEMPLATE_WIDTH;
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [template.widthMM, template.heightMM]);

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, slotId: number, action: EditAction) => {
    e.stopPropagation();
    setSelectedSlotId(slotId);
    const currentSlot = slots.find(s => s.id === slotId);
    if (!currentSlot || !containerRef.current) return;
    
    const { x: startX, y: startY } = getPointerPosition(e);

    setEditingState({
      action,
      slotId,
      startX,
      startY,
      startSlotX: currentSlot.x,
      startSlotY: currentSlot.y,
      startSlotWidth: currentSlot.width,
      startSlotHeight: currentSlot.height,
    });
  }, [slots]);

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!editingState || !containerRef.current) return;
    
    const { x, y } = getPointerPosition(e);
    const scale = scaleRef.current;
    
    const dx = (x - editingState.startX) / scale;
    const dy = (y - editingState.startY) / scale;
    
    setSlots(prevSlots => prevSlots.map(slot => {
      if (slot.id === editingState.slotId) {
        const newSlot = { ...slot };
        if (editingState.action === 'drag') {
          newSlot.x = Math.round(Math.max(0, Math.min(TEMPLATE_WIDTH - slot.width, editingState.startSlotX + dx)));
          newSlot.y = Math.round(Math.max(0, Math.min(TEMPLATE_HEIGHT - slot.height, editingState.startSlotY + dy)));
        } else if (editingState.action === 'resize-br') {
          newSlot.width = Math.round(Math.max(50, Math.min(TEMPLATE_WIDTH - slot.x, editingState.startSlotWidth + dx)));
          newSlot.height = Math.round(Math.max(50, Math.min(TEMPLATE_HEIGHT - slot.y, editingState.startSlotHeight + dy)));
        }
        return newSlot;
      }
      return slot;
    }));
  }, [editingState]);
  
  const handlePointerUp = useCallback(() => {
    setEditingState(null);
  }, []);
  
  useEffect(() => {
    if (editingState) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [editingState, handlePointerMove, handlePointerUp]);

  const handleAddSlot = () => {
    const newId = Date.now();
    const highestInputId = Math.max(0, ...slots.map(s => s.inputId));
    const newSlot: PhotoSlot = {
      id: newId,
      inputId: highestInputId + 1,
      x: 400,
      y: 700,
      width: 400,
      height: 400,
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newId);
  };

  const handleDeleteSlot = () => {
    if (selectedSlotId === null) return;
    setSlots(slots.filter(s => s.id !== selectedSlotId));
    setSelectedSlotId(null);
  };
  
  const handleDuplicateSlot = () => {
    if (selectedSlotId === null) return;
    const originalSlot = slots.find(s => s.id === selectedSlotId);
    if (!originalSlot) return;
    const newId = Date.now();
    const newSlot: PhotoSlot = {
      ...originalSlot,
      id: newId,
      x: originalSlot.x + 20,
      y: originalSlot.y + 20,
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newId);
  };
  
  const handleReset = () => {
    setSlots(DEFAULT_SLOTS);
    setSelectedSlotId(null);
  };
  
  const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSlotId) return;

    const { name, value } = e.target;
    const numericValue = parseInt(value, 10);

    if (isNaN(numericValue)) return;

    setSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === selectedSlotId
          ? { ...slot, [name]: numericValue }
          : slot
      )
    );
  };
  
  return (
    <div className="w-full">
      <div className="text-center">
        <h2 className="font-bebas text-4xl mb-2">Customize Layout: {template.name}</h2>
        <p className="text-gray-400 mb-4 text-center">Click a slot to select. Drag to move, or edit properties below.</p>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-8 mt-4">
        {/* Left Column: Preview */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <div 
            ref={containerRef} 
            className="relative w-full max-w-sm bg-gray-800 touch-none shadow-2xl shadow-purple-500/20"
            style={{ 
                userSelect: 'none',
                aspectRatio: `${template.widthMM} / ${template.heightMM}`
            }}
            onClick={() => setSelectedSlotId(null)}
          >
            <img src={template.imageUrl} alt="Template background" className="absolute inset-0 w-full h-full pointer-events-none" />
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              return (
                <div
                  key={slot.id}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => handlePointerDown(e, slot.id, 'drag')}
                  onTouchStart={(e) => handlePointerDown(e, slot.id, 'drag')}
                  className={`absolute bg-purple-500/30 border-2 border-dashed ${isSelected ? 'border-green-400' : 'border-purple-300'} cursor-move flex items-center justify-center`}
                  style={{
                    left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                    top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                    width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                    height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                  }}
                >
                  <div className="text-white font-bebas text-2xl tracking-wider bg-black/30 px-2 py-1 rounded select-none pointer-events-none">
                      INPUT {slot.inputId}
                  </div>
                  {isSelected && <div className={`absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full cursor-se-resize`}
                    onMouseDown={(e) => handlePointerDown(e, slot.id, 'resize-br')}
                    onTouchStart={(e) => handlePointerDown(e, slot.id, 'resize-br')}
                  />}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Right Column: Controls */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-2 w-full">
              <button onClick={handleAddSlot} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add New Slot</button>
              <button onClick={handleReset} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Reset to Default</button>
              <button onClick={handleDuplicateSlot} disabled={selectedSlotId === null} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">Duplicate Selected</button>
              <button onClick={handleDeleteSlot} disabled={selectedSlotId === null} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">Delete Selected</button>
          </div>

          {selectedSlot ? (
            <div className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-center mb-4 text-green-400">Edit Selected Slot</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    
                    <div>
                        <label htmlFor="inputId" className="block text-sm font-medium text-gray-300">Input ID</label>
                        <input
                            type="number"
                            id="inputId"
                            name="inputId"
                            value={selectedSlot.inputId}
                            onChange={handlePropertyChange}
                            min="1"
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                    </div>
                    <div /> 

                    <div>
                        <label htmlFor="x" className="block text-sm font-medium text-gray-300">X Position</label>
                        <input
                            type="number"
                            id="x"
                            name="x"
                            value={selectedSlot.x}
                            onChange={handlePropertyChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="y" className="block text-sm font-medium text-gray-300">Y Position</label>
                        <input
                            type="number"
                            id="y"
                            name="y"
                            value={selectedSlot.y}
                            onChange={handlePropertyChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="width" className="block text-sm font-medium text-gray-300">Width</label>
                        <input
                            type="number"
                            id="width"
                            name="width"
                            value={selectedSlot.width}
                            onChange={handlePropertyChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-300">Height</label>
                        <input
                            type="number"
                            id="height"
                            name="height"
                            value={selectedSlot.height}
                            onChange={handlePropertyChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>
          ) : (
            <div className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center min-h-[190px]">
                <p className="text-gray-500">Select a slot to edit its properties.</p>
            </div>
          )}

          <div className="mt-auto w-full flex flex-col gap-3">
            <button
                onClick={() => onSave(slots)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
            >
                Save & Exit to Template Manager
            </button>
            <button
                onClick={onCancel}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
            >
                Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTemplateScreen;
