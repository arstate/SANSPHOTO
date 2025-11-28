
import React, { useState } from 'react';
import { Template, FilterOption } from '../types';
import { CheckIcon } from './icons/CheckIcon';

interface FilterSelectionScreenProps {
  images: string[];
  template: Template;
  onFilterSelected: (filterCss: string) => void;
}

export const FILTERS: FilterOption[] = [
  { id: 'normal', name: 'Normal', cssFilter: 'none' },
  { id: 'grayscale', name: 'B&W', cssFilter: 'grayscale(1)' },
  { id: 'sepia', name: 'Sepia', cssFilter: 'sepia(1)' },
  { id: 'vintage', name: 'Vintage', cssFilter: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
  { id: 'cool', name: 'Cool', cssFilter: 'hue-rotate(180deg) sepia(0.2)' },
  { id: 'warm', name: 'Warm', cssFilter: 'sepia(0.3) saturate(1.4)' },
  { id: 'bright', name: 'Bright', cssFilter: 'brightness(1.2) contrast(1.1)' },
  { id: 'dramatic', name: 'Drama', cssFilter: 'contrast(1.4) saturate(0.8)' },
];

const FilterSelectionScreen: React.FC<FilterSelectionScreenProps> = ({
  images, template, onFilterSelected
}) => {
  const [selectedFilterId, setSelectedFilterId] = useState<string>('normal');
  const [activeCssFilter, setActiveCssFilter] = useState<string>('none');

  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  const handleSelectFilter = (filter: FilterOption) => {
    setSelectedFilterId(filter.id);
    setActiveCssFilter(filter.cssFilter);
  };

  const handleContinue = () => {
    onFilterSelected(activeCssFilter);
  };

  return (
    <div className="relative flex flex-col items-center h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 pt-4 pb-2 text-center z-10">
        <h2 className="font-bebas text-4xl text-[var(--color-text-primary)]">Choose a Filter</h2>
      </div>

      {/* Main Preview Area */}
      <main className="flex-grow w-full flex items-center justify-center p-4 min-h-0">
        <div 
            className={`relative shadow-2xl shadow-[var(--color-accent-primary)]/20 bg-white rounded-sm overflow-hidden border-4 border-white ${isLandscape ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}
            style={{ 
                maxHeight: '100%', 
                maxWidth: '100%',
                height: isLandscape ? 'auto' : '100%',
                width: isLandscape ? '100%' : 'auto'
            }}
        >
            {/* 1. Captured Photos Layer (Applying Filter) */}
            <div className="absolute inset-0 w-full h-full">
                {images.map((imgSrc, index) => {
                    const inputId = index + 1;
                    return template.photoSlots.filter(slot => slot.inputId === inputId).map(slot => (
                        <img
                            key={`filter-preview-${slot.id}`}
                            src={imgSrc}
                            alt={`Photo ${inputId}`}
                            className="absolute object-cover transition-all duration-300"
                            style={{
                                left: `${(slot.x / TEMPLATE_WIDTH) * 100}%`,
                                top: `${(slot.y / TEMPLATE_HEIGHT) * 100}%`,
                                width: `${(slot.width / TEMPLATE_WIDTH) * 100}%`,
                                height: `${(slot.height / TEMPLATE_HEIGHT) * 100}%`,
                                transform: `rotate(${slot.rotation || 0}deg) scaleX(-1)`,
                                filter: activeCssFilter // Apply filter ONLY to photos
                            }}
                        />
                    ));
                })}
            </div>

            {/* 2. Template Layer (No Filter) */}
            <img 
                src={template.imageUrl} 
                alt="Template Frame" 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
            />
        </div>
      </main>

      {/* Filter Selection Slider & Controls */}
      <div className="shrink-0 w-full bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] p-4 flex flex-col gap-4 z-20">
          
          {/* Slider */}
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin px-2 justify-start md:justify-center">
              {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleSelectFilter(filter)}
                    className={`flex flex-col items-center gap-2 shrink-0 transition-transform ${selectedFilterId === filter.id ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                  >
                      <div className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedFilterId === filter.id ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]/50' : 'border-gray-500'}`}>
                          {/* Thumbnail Preview using the first captured image */}
                          <img 
                            src={images[0]} 
                            alt={filter.name} 
                            className="w-full h-full object-cover"
                            style={{ filter: filter.cssFilter, transform: 'scaleX(-1)' }}
                          />
                      </div>
                      <span className={`text-xs font-bold ${selectedFilterId === filter.id ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {filter.name}
                      </span>
                  </button>
              ))}
          </div>

          {/* Action Button */}
          <div className="w-full flex justify-center">
              <button
                  onClick={handleContinue}
                  className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-12 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
              >
                  <CheckIcon />
                  <span>Continue</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default FilterSelectionScreen;
