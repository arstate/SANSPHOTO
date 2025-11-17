import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoSlot, Template } from '../types';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { FitToScreenIcon } from './icons/FitToScreenIcon';


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
  const [zoom, setZoom] = useState(1);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;
  
  const STAGE_MULTIPLIER = 5;
  const STAGE_WIDTH = TEMPLATE_WIDTH * STAGE_MULTIPLIER;
  const STAGE_HEIGHT = TEMPLATE_HEIGHT * STAGE_MULTIPLIER;

  const selectedSlot = selectedSlotId !== null ? slots.find(s => s.id === selectedSlotId) : null;
  
  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, slotId: number, action: EditAction) => {
    if (isSpacePressed) return;
    e.stopPropagation();
    setSelectedSlotId(slotId);
    const currentSlot = slots.find(s => s.id === slotId);
    if (!currentSlot || !previewContainerRef.current) return;
    
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
  }, [slots, isSpacePressed]);

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!editingState || !previewContainerRef.current) return;
    
    const { x, y } = getPointerPosition(e);
    
    const dx = (x - editingState.startX) / zoom;
    const dy = (y - editingState.startY) / zoom;
    
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
  }, [editingState, TEMPLATE_WIDTH, TEMPLATE_HEIGHT, zoom]);
  
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

  // Pan/Hand Tool Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            setIsSpacePressed(true);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            setIsSpacePressed(false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSpacePressed || !scrollContainerRef.current) return;
    e.preventDefault();
    setIsPanning(true);
    panState.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
    };
  };

  useEffect(() => {
      const scroller = scrollContainerRef.current;
      if (!scroller) return;

      const handlePanMove = (e: MouseEvent) => {
          if (!panState.current) return;
          e.preventDefault();
          const dx = e.clientX - panState.current.startX;
          const dy = e.clientY - panState.current.startY;
          scroller.scrollLeft = panState.current.scrollLeft - dx;
          scroller.scrollTop = panState.current.scrollTop - dy;
      };

      const handlePanEnd = () => {
          setIsPanning(false);
          panState.current = null;
      };
      
      if(isPanning) {
          window.addEventListener('mousemove', handlePanMove);
          window.addEventListener('mouseup', handlePanEnd);
      }

      return () => {
          window.removeEventListener('mousemove', handlePanMove);
          window.removeEventListener('mouseup', handlePanEnd);
      };
  }, [isPanning]);
  
  // Initial centering of the preview
  useEffect(() => {
      if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          container.scrollLeft = (STAGE_WIDTH - container.clientWidth) / 2;
          container.scrollTop = (STAGE_HEIGHT - container.clientHeight) / 2;
      }
  }, [STAGE_WIDTH, STAGE_HEIGHT]);


  const handleAddSlot = () => {
    const newId = Date.now();
    const highestInputId = Math.max(0, ...slots.map(s => s.inputId));
    const newSlot: PhotoSlot = {
      id: newId,
      inputId: highestInputId + 1,
      x: TEMPLATE_WIDTH / 2 - 200,
      y: TEMPLATE_HEIGHT / 2 - 200,
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

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.1, z - 0.1));
  const handleResetZoom = () => setZoom(1);
  
  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-primary)]">
      <header className="text-center shrink-0 pt-4 px-4">
        <h2 className="font-bebas text-4xl mb-2">Customize Layout: {template.name}</h2>
        <p className="text-[var(--color-text-muted)] text-center">Click a slot to select. Drag to move, or edit properties on the right.</p>
      </header>

      <main className="flex-grow w-full flex flex-col md:flex-row min-h-0">
        {/* Left Column: Preview */}
        <div className="w-full md:w-2/3 p-4 flex flex-col items-stretch justify-center">
            <div 
              ref={scrollContainerRef} 
              className="w-full flex-grow overflow-auto flex items-center justify-center rounded-lg bg-[var(--color-bg-primary)]/50 scrollbar-thin min-h-0"
              style={{ cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handlePanStart}
            >
              <div 
                  className="relative shrink-0"
                  style={{ width: `${STAGE_WIDTH}px`, height: `${STAGE_HEIGHT}px` }}
              >
                  <div
                      ref={previewContainerRef}
                      className="absolute bg-[var(--color-bg-secondary)] touch-none shadow-2xl"
                      style={{
                          width: `${TEMPLATE_WIDTH}px`,
                          height: `${TEMPLATE_HEIGHT}px`,
                          top: `${(STAGE_HEIGHT - TEMPLATE_HEIGHT) / 2}px`,
                          left: `${(STAGE_WIDTH - TEMPLATE_WIDTH) / 2}px`,
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center',
                          userSelect: 'none',
                      }}
                      onClick={() => !isSpacePressed && setSelectedSlotId(null)}
                  >
                      <img src={template.imageUrl} alt="Template background" className="absolute inset-0 w-full h-full pointer-events-none" />
                      {slots.map((slot) => {
                          const isSelected = slot.id === selectedSlotId;
                          return (
                          <div
                              key={slot.id}
                              onClick={(e) => !isSpacePressed && e.stopPropagation()}
                              onMouseDown={(e) => handlePointerDown(e, slot.id, 'drag')}
                              onTouchStart={(e) => handlePointerDown(e, slot.id, 'drag')}
                              className={`absolute bg-purple-500/30 border-2 border-dashed ${isSelected ? 'border-green-400' : 'border-purple-300'} ${!isSpacePressed ? 'cursor-move' : ''} flex items-center justify-center`}
                              style={{
                                left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                                top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                                width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                                height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                                pointerEvents: isPanning ? 'none' : 'auto'
                              }}
                          >
                              <div className="text-white font-bebas text-2xl tracking-wider bg-black/30 px-2 py-1 rounded select-none pointer-events-none">
                                  INPUT {slot.inputId}
                              </div>
                              {isSelected && <div className={`absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full ${!isSpacePressed ? 'cursor-se-resize' : ''}`}
                              onMouseDown={(e) => handlePointerDown(e, slot.id, 'resize-br')}
                              onTouchStart={(e) => handlePointerDown(e, slot.id, 'resize-br')}
                              />}
                          </div>
                          );
                      })}
                  </div>
                </div>
            </div>
            <div className="shrink-0 mt-4 flex items-center justify-center gap-4 bg-[var(--color-bg-secondary)] p-2 rounded-full">
                <button onClick={handleZoomOut} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors" aria-label="Zoom Out"><ZoomOutIcon /></button>
                <button onClick={handleResetZoom} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors" aria-label="Reset Zoom"><FitToScreenIcon /></button>
                <button onClick={handleZoomIn} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors" aria-label="Zoom In"><ZoomInIcon /></button>
                <div className="text-sm font-mono text-[var(--color-text-accent)] w-16 text-center">{Math.round(zoom * 100)}%</div>
            </div>
        </div>

        {/* Right Column: Controls & Actions */}
        <div className="w-full md:w-1/3 flex flex-col border-t-4 md:border-t-0 md:border-l-4 border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/30">
            <div className="flex-grow p-4 overflow-y-auto scrollbar-thin">
                <div className="w-full flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <button onClick={handleAddSlot} className="bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-2 px-4 rounded">Add New Slot</button>
                        <button onClick={handleDuplicateSlot} disabled={selectedSlotId === null} className="bg-[var(--color-accent-secondary)] hover:bg-[var(--color-accent-secondary-hover)] text-[var(--color-accent-secondary-text)] font-bold py-2 px-4 rounded disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed">Duplicate</button>
                        <button onClick={handleDeleteSlot} disabled={selectedSlotId === null} className="col-span-2 bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)] font-bold py-2 px-4 rounded disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed">Delete Selected</button>
                    </div>

                    {selectedSlot ? (
                      <div className="w-full p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
                          <h3 className="text-lg font-bold text-center mb-4 text-green-400">Edit Selected Slot</h3>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              <div>
                                  <label htmlFor="inputId" className="block text-sm font-medium text-[var(--color-text-secondary)]">Input ID</label>
                                  <input
                                      type="number" id="inputId" name="inputId" value={selectedSlot.inputId}
                                      onChange={handlePropertyChange} min="1"
                                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                                  />
                              </div>
                              <div /> 
                              <div>
                                  <label htmlFor="x" className="block text-sm font-medium text-[var(--color-text-secondary)]">X Position</label>
                                  <input
                                      type="number" id="x" name="x" value={selectedSlot.x} onChange={handlePropertyChange}
                                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                                  />
                              </div>
                              <div>
                                  <label htmlFor="y" className="block text-sm font-medium text-[var(--color-text-secondary)]">Y Position</label>
                                  <input
                                      type="number" id="y" name="y" value={selectedSlot.y} onChange={handlePropertyChange}
                                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                                  />
                              </div>
                              <div>
                                  <label htmlFor="width" className="block text-sm font-medium text-[var(--color-text-secondary)]">Width</label>
                                  <input
                                      type="number" id="width" name="width" value={selectedSlot.width} onChange={handlePropertyChange}
                                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                                  />
                              </div>
                              <div>
                                  <label htmlFor="height" className="block text-sm font-medium text-[var(--color-text-secondary)]">Height</label>
                                  <input
                                      type="number" id="height" name="height" value={selectedSlot.height} onChange={handlePropertyChange}
                                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                                  />
                              </div>
                          </div>
                      </div>
                    ) : (
                      <div className="w-full p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] flex flex-col items-center justify-center min-h-[190px] text-center">
                          <p className="text-[var(--color-text-muted)]">Select a slot on the left to edit its properties.</p>
                          <p className="text-[var(--color-text-muted)] mt-2 text-sm">Hold <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd> to pan the view.</p>
                      </div>
                    )}
                </div>
            </div>

            <footer className="shrink-0 p-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                <div className="w-full flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => onSave(slots)}
                        className="w-full flex-1 bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                    >
                        Save & Exit
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full flex-1 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                    >
                        Cancel
                    </button>
                </div>
            </footer>
        </div>
      </main>
    </div>
  );
};

export default EditTemplateScreen;