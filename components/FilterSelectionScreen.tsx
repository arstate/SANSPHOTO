
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Template } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { getCachedImage, storeImageInCache } from '../utils/db';

interface FilterSelectionScreenProps {
  images: string[];
  template: Template;
  onNext: (selectedFilter: string, imageDataUrl: string) => void;
}

interface FilterOption {
  name: string;
  value: string;
  previewColor?: string;
}

const FILTERS: FilterOption[] = [
  { name: 'Normal', value: 'none' },
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
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isLandscape = template.orientation === 'landscape';
  const TEMPLATE_WIDTH = isLandscape ? 1800 : 1200;
  const TEMPLATE_HEIGHT = isLandscape ? 1200 : 1800;

  // Use the first captured image as the thumbnail for filters
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

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
          if (img.src.startsWith('blob:')) {
              URL.revokeObjectURL(img.src);
          }
          resolve(img);
      };
      img.onerror = (e) => reject(new Error(`Failed to load image from src: ${src.substring(0, 50)}...`));

      // 1. Load directly if data URL
      if (src.startsWith('data:')) {
        img.src = src;
        return;
      }

      try {
        // 2. Try cache
        const cachedBlob = await getCachedImage(src);
        if (cachedBlob) {
          img.src = URL.createObjectURL(cachedBlob);
          return;
        }

        // 3. Network fetch with proxy fallbacks if needed
        let fetchUrl = src;
        if (src.startsWith('http')) {
            fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
        }
        
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status}`);
        }
        const networkBlob = await response.blob();
        
        // 4. Cache and load
        await storeImageInCache(src, networkBlob);
        img.src = URL.createObjectURL(networkBlob);

      } catch (error) {
        reject(error);
      }
    });
  };

  const processImageAndContinue = useCallback(async () => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    if (!canvas) {
        console.error("Canvas not found");
        setIsProcessing(false);
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Canvas context not found");
        setIsProcessing(false);
        return;
    }

    canvas.width = TEMPLATE_WIDTH;
    canvas.height = TEMPLATE_HEIGHT;

    try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load all images
        const imagePromises: Promise<HTMLImageElement>[] = [
            loadImage(template.imageUrl), 
            ...images.map(src => loadImage(src))
        ];

        const [templateImg, ...loadedImages] = await Promise.all(imagePromises);

        // Draw photos into slots with filter
        template.photoSlots.forEach(slot => {
            const img = loadedImages[slot.inputId - 1];
            if (!img) return;
            
            ctx.save();
            
            // --- APPLY FILTER ---
            if (selectedFilter && selectedFilter !== 'none') {
                ctx.filter = selectedFilter;
            }

            const slotAspectRatio = slot.width / slot.height;
            const imgAspectRatio = img.width / img.height;
            
            let sx, sy, sWidth, sHeight;
            if (imgAspectRatio > slotAspectRatio) {
                sHeight = img.height;
                sWidth = sHeight * slotAspectRatio;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.width;
                sHeight = sWidth / slotAspectRatio;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }
            
            const slotCenterX = slot.x + slot.width / 2;
            const slotCenterY = slot.y + slot.height / 2;
            const rotationDegrees = slot.rotation || 0;

            ctx.translate(slotCenterX, slotCenterY);
            if (rotationDegrees !== 0) {
                ctx.rotate(rotationDegrees * Math.PI / 180);
            }
            ctx.scale(-1, 1);

            ctx.drawImage(
                img,
                sx, sy, sWidth, sHeight,
                -slot.width / 2, -slot.height / 2, slot.width, slot.height
            );
            
            ctx.restore(); // Restores context, resets filter
        });

        // Draw template overlay (no filter)
        ctx.drawImage(templateImg, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
        
        // Generate final Data URL
        const finalImageDataUrl = canvas.toDataURL('image/png');
        
        // Pass data up to trigger upload and navigation
        onNext(selectedFilter, finalImageDataUrl);

    } catch (error) {
        console.error("Error processing final image:", error);
        alert("Failed to process image. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  }, [images, template, selectedFilter, TEMPLATE_WIDTH, TEMPLATE_HEIGHT, onNext]);

  return (
    <div className="relative flex flex-col items-center h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      <header className="text-center shrink-0 py-4 px-4 z-20">
        <h2 className="font-bebas text-3xl sm:text-4xl text-[var(--color-text-primary)] tracking-wider">Pilih Filter</h2>
        <p className="text-[var(--color-text-muted)] text-sm">Geser untuk mengubah efek foto</p>
      </header>

      {/* Main Preview Area */}
      <main className="flex-grow flex items-center justify-center w-full min-h-0 p-4 relative z-10 overflow-hidden">
        
        {/* 
           Layout Fix: Use the template image as the relative parent.
           This ensures the aspect ratio is always perfect based on the image's intrinsic dimensions.
           The div wrapper shrink-wraps the image.
        */}
        <div className="relative inline-flex shadow-2xl bg-white p-1 md:p-2 rounded-sm max-w-full max-h-full">
            <div className="relative">
                {/* 
                    Layer 1 (Top): Template Image 
                    It dictates the size of the container. 
                    z-20 ensures it's above the photos (acting as a frame).
                */}
                <img 
                    src={template.imageUrl} 
                    alt="Template Frame" 
                    className="block max-w-full object-contain relative z-20 pointer-events-none select-none" 
                    style={{ 
                        maxHeight: 'calc(100vh - 280px)', // Reserve space for header (approx 80px) and footer/slider (approx 200px)
                        width: 'auto'
                    }}
                />

                {/* 
                    Layer 2 (Bottom): Captured Photos 
                    Absolute position matches the Template Image exactly.
                    z-10 ensures they are below the template frame.
                */}
                <div className="absolute inset-0 z-10 w-full h-full">
                    {images.map((imgSrc, index) => {
                        const inputId = index + 1;
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
                                    transform: `rotate(${slot.rotation || 0}deg) scaleX(-1)`, // Mirror effect consistent with capture
                                    filter: selectedFilter, // Apply live filter here
                                }}
                            />
                        ));
                    })}
                </div>
            </div>
        </div>
      </main>

      {/* Footer Area: Filter Slider & Finish Button */}
      <div className="shrink-0 w-full max-w-6xl flex flex-col gap-4 z-20 bg-[var(--color-bg-primary)] pb-6">
        
        {/* Filter Slider */}
        <div 
            ref={sliderRef}
            className="flex overflow-x-auto space-x-6 py-2 px-4 scrollbar-thin cursor-grab select-none active:cursor-grabbing items-center justify-start md:justify-center"
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
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 transition-all duration-200 ${selectedFilter === filter.value ? 'border-[var(--color-accent-primary)] ring-4 ring-[var(--color-accent-primary)]/30' : 'border-[var(--color-border-secondary)]'}`}
                    >
                        {thumbnailImage ? (
                            <img 
                                src={thumbnailImage} 
                                alt={filter.name} 
                                className="w-full h-full object-cover"
                                style={{ filter: filter.value }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-500" />
                        )}
                    </div>
                    <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-full ${selectedFilter === filter.value ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>
                        {filter.name}
                    </span>
                </button>
            ))}
        </div>

        {/* Action Button */}
        <div className="w-full flex justify-center px-4">
            <button
                onClick={processImageAndContinue}
                disabled={isProcessing}
                className="w-full max-w-sm bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait"
            >
                {isProcessing ? (
                    <div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div>
                ) : (
                    <CheckIcon />
                )}
                <span>{isProcessing ? 'Processing...' : 'Finish & Print'}</span>
            </button>
        </div>
      </div>
      
      {/* Hidden Canvas for Image Generation */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default FilterSelectionScreen;
