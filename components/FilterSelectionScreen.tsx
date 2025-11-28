
import React, { useState, useRef, useEffect } from 'react';
import { Template } from '../types';
import { CheckIcon } from './icons/CheckIcon';

interface FilterSelectionScreenProps {
  images: string[];
  template: Template;
  onNext: (selectedFilter: string) => void;
}

interface FilterOption {
  name: string;
  value: string;
  previewColor?: string; // Optional color for button border/accent
}

const FILTERS: FilterOption[] = [
  { name: 'Original', value: 'none' },
  { name: 'B&W', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
  { name: 'Cool', value: 'saturate(50%) brightness(110%)' },
  { name: 'Vintage', value: 'sepia(40%) contrast(120%) brightness(90%)' },
  { name: 'Soft', value: 'brightness(110%) contrast(90%) saturate(90%)' },
  { name: 'Dramatic', value: 'contrast(150%)' },
  { name: 'Fade', value: 'opacity(80%) brightness(120%)' },
];

const FilterSelectionScreen: React.FC<FilterSelectionScreenProps> = ({ images, template, onNext }) => {
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  const isLandscape = template.orientation === 'landscape';
  // Use specific dimensions to calculate strict aspect ratio
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  // Use the first captured image as the thumbnail for filters
  // If no images (shouldn't happen), fallback to gray
  const thumbnailImage = images.length > 0 ? images[0] : null;

  // Drag to Scroll Refs for Slider
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDown.current = true;
    sliderRef.current.classList.add('cursor-grabbing');
    sliderRef.current.classList.remove('cursor-grab');
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!sliderRef.current) return;
    isDown.current = false;
    sliderRef.current.classList.remove('cursor-grabbing');
    sliderRef.current.classList.add('cursor-grab');
  };

  const handleMouseUp = () => {
    if (!sliderRef.current) return;
    isDown.current = false;
    sliderRef.current.classList.remove('cursor-grabbing');
    sliderRef.current.classList.add('cursor-grab');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="relative flex flex-col items-center h-full w-full p-4 bg-[var(--color-bg-primary)] overflow-hidden">
      <header className="text-center shrink-0 mb-4 mt-2">
        <h2 className="font-bebas text-4xl text-[var(--color-text-primary)] tracking-wider">Pilih Filter</h2>
        <p className="text-[var(--color-text-muted)] text-sm">Geser di bawah untuk mengubah nuansa foto</p>
      </header>

      {/* Main Preview Area */}
      <main className="w-full flex-grow flex items-center justify-center min-h-0 relative overflow-hidden">
        {/* Container for the preview consisting of Template + Photos */}
        <div 
            className="relative shadow-2xl overflow-hidden bg-white"
            style={{ 
                aspectRatio: `${TEMPLATE_WIDTH} / ${TEMPLATE_HEIGHT}`,
                height: isLandscape ? 'auto' : '95%', // Max height for portrait
                width: isLandscape ? '95%' : 'auto',  // Max width for landscape
                maxHeight: '100%',
                maxWidth: '100%'
            }}
        >
            {/* Layer 1: Captured Images (Affected by Filter) */}
            {/* We map slots exactly like Capture/Preview screens to ensure alignment */}
            {images.map((imgSrc, index) => {
                const inputId = index + 1;
                // Find all slots for this input ID
                const slots = template.photoSlots.filter(slot => slot.inputId === inputId);
                
                return slots.map(slot => (
                    <img
                        key={`filter-preview-${slot.id}`}
                        src={imgSrc}
                        alt={`Preview ${inputId}`}
                        className="absolute object-cover origin-center"
                        style={{
                            left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                            top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                            width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                            height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                            transform: `rotate(${slot.rotation || 0}deg) scaleX(-1)`, // Maintain mirroring if used in capture
                            filter: selectedFilter, // APPLY FILTER HERE
                            zIndex: 1 // Below template
                        }}
                    />
                ));
            })}

            {/* Layer 2: Template Overlay (NOT Affected by Filter) */}
            <img 
                src={template.imageUrl} 
                alt="Template Frame" 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                style={{ zIndex: 10 }}
            />
        </div>
      </main>

      {/* Filter Slider */}
      <div className="w-full max-w-6xl shrink-0 mt-4 mb-4">
        <div 
            ref={sliderRef}
            className="flex overflow-x-auto space-x-6 py-4 px-4 scrollbar-thin cursor-grab select-none active:cursor-grabbing items-center justify-start md:justify-center"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            {FILTERS.map((filter) => (
                <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`shrink-0 flex flex-col items-center gap-2 group transition-all duration-200 focus:outline-none transform ${selectedFilter === filter.value ? 'scale-110' : 'hover:scale-105'}`}
                >
                    <div 
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 transition-all duration-200 ${selectedFilter === filter.value ? 'border-[var(--color-accent-primary)] ring-4 ring-[var(--color-accent-primary)]/30' : 'border-[var(--color-border-secondary)]'}`}
                    >
                        {thumbnailImage ? (
                            <img 
                                src={thumbnailImage} 
                                alt={filter.name} 
                                className="w-full h-full object-cover"
                                style={{ filter: filter.value }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-300" />
                        )}
                    </div>
                    <span className={`text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-full ${selectedFilter === filter.value ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>
                        {filter.name}
                    </span>
                </button>
            ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="shrink-0 w-full max-w-sm mb-2">
        <button
            onClick={() => onNext(selectedFilter)}
            className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
            <CheckIcon />
            <span>Finish & Print</span>
        </button>
      </div>
    </div>
  );
};

export default FilterSelectionScreen;
