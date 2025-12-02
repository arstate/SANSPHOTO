
import React, { useState, useEffect, useRef } from 'react';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Template } from '../types';
import { getCachedImage, storeImageInCache } from '../utils/db';

interface TemplateSelectionProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onBack: () => void;
  isAdminLoggedIn: boolean;
  onAddTemplate: () => void;
  onEditMetadata: (template: Template) => void;
  onEditLayout: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

const ImageFromCache: React.FC<{ src: string; alt: string; className: string; }> = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      setStatus('loading');
      if (!src) {
        if (isMounted) setStatus('error');
        return;
      }
      
      try {
        // 1. Coba cache
        const cachedBlob = await getCachedImage(src);
        if (isMounted && cachedBlob) {
            objectUrl = URL.createObjectURL(cachedBlob);
            setImageSrc(objectUrl);
            setStatus('loaded');
            return;
        }

        // 2. Jika tidak ada di cache, ambil dari jaringan
        let fetchUrl = src;
        if (src.startsWith('http')) {
            fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
        }
        
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Network fetch failed with status: ${response.status}`);
        }
        const networkBlob = await response.blob();
        
        if (isMounted) {
            // 3. Simpan di cache untuk penggunaan berikutnya
            await storeImageInCache(src, networkBlob);
            
            // 4. Tampilkan gambar
            objectUrl = URL.createObjectURL(networkBlob);
            setImageSrc(objectUrl);
            setStatus('loaded');
        }

      } catch (error) {
        console.error(`Gagal memuat gambar ${src}:`, error);
        if (isMounted) setStatus('error');
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (status === 'loading') {
    return <div className={`bg-[var(--color-bg-tertiary)] animate-pulse ${className}`}></div>;
  }
  
  if (status === 'error' || !imageSrc) {
    return (
        <div className={`bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center text-center text-xs text-red-400 p-2 ${className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Gagal memuat</span>
        </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} loading="lazy" draggable={false} />;
};


const TemplateSelection: React.FC<TemplateSelectionProps> = ({ 
  templates, onSelect, onBack, isAdminLoggedIn, onAddTemplate, onEditMetadata, onEditLayout, onDelete 
}) => {
  const [previewedTemplate, setPreviewedTemplate] = useState<Template | null>(templates[0] || null);
  
  // Drag to Scroll Refs
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    // If templates change (e.g., one is deleted or list is filtered) and the previewed one is gone,
    // reset to the first available template in the new list.
    if (!previewedTemplate || !templates.find(t => t.id === previewedTemplate.id)) {
      setPreviewedTemplate(templates[0] || null);
    }
  }, [templates, previewedTemplate]);

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
    const walk = (x - startX.current) * 2; // Scroll-fast multiplier
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-none border-2 border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>
      
      <header className="text-center shrink-0 my-4 px-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">
          {isAdminLoggedIn ? 'Manage All Templates' : 'Choose Your Template'}
        </h2>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full min-h-0 px-4">
        {previewedTemplate ? (
            <div className={`group relative w-full ${previewedTemplate.orientation === 'landscape' ? 'max-w-2xl' : 'max-w-xs'} border-4 border-[var(--color-border-primary)] rounded-none p-2 bg-[var(--color-bg-secondary)] flex flex-col text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]`}>
                <div className="relative">
                    <ImageFromCache 
                        src={previewedTemplate.imageUrl} 
                        alt={previewedTemplate.name}
                        className={`rounded-none border-2 border-black w-full ${previewedTemplate.orientation === 'landscape' ? 'aspect-[3/2]' : 'aspect-[2/3]'} object-cover`}
                    />
                    {isAdminLoggedIn && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => onEditLayout(previewedTemplate)}
                                className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg transition-transform transform hover:scale-105"
                            >
                                Edit Layout
                            </button>
                        </div>
                    )}
                </div>
                <div className="mt-2">
                    <p className="text-[var(--color-text-secondary)] font-bold uppercase tracking-wide">{previewedTemplate.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono">{previewedTemplate.widthMM}mm x {previewedTemplate.heightMM}mm</p>
                </div>
                {isAdminLoggedIn ? (
                    <div className="mt-2 pt-2 border-t-2 border-[var(--color-border-primary)] flex justify-center gap-2">
                        <button onClick={() => onEditMetadata(previewedTemplate)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-2" aria-label="Edit Details"><EditIcon /></button>
                        <button onClick={() => {
                            if (window.confirm('Are you sure you want to delete this template permanently?')) {
                                onDelete(previewedTemplate.id)
                            }
                        }} className="text-[var(--color-text-muted)] hover:text-[var(--color-negative)] p-2" aria-label="Delete Template"><TrashIcon /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => onSelect(previewedTemplate)}
                        className="mt-4 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 text-md transition-all uppercase w-full"
                    >
                        Use This Template
                    </button>
                )}
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center text-[var(--color-text-muted)]">
                <p>{isAdminLoggedIn ? "No templates found. Add one below!" : "No templates available for this event."}</p>
            </div>
        )}
      </main>

      <footer className="w-full shrink-0 pt-6">
        <div 
            ref={sliderRef}
            className="flex overflow-x-auto space-x-4 pb-2 scrollbar-thin px-4 cursor-grab select-none active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            {templates.map(template => (
                <button
                    key={template.id}
                    onClick={() => setPreviewedTemplate(template)}
                    className={`relative shrink-0 ${template.orientation === 'landscape' ? 'w-[13.5rem] h-36' : 'w-24 h-36'} rounded-none overflow-hidden border-4 transition-colors ${previewedTemplate?.id === template.id ? 'border-[var(--color-accent-primary)]' : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'}`}
                    aria-label={`Select ${template.name}`}
                >
                    <ImageFromCache 
                        src={template.imageUrl} 
                        alt={template.name}
                        className="w-full h-full object-cover pointer-events-none" 
                    />
                    {isAdminLoggedIn && !template.eventId && (
                        <div className="absolute top-0 right-0 p-1 bg-yellow-500/80 rounded-none border-l border-b border-black" title="Unassigned">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </div>
                    )}
                </button>
            ))}
            {isAdminLoggedIn && (
                <button
                    onClick={onAddTemplate}
                    className="shrink-0 w-24 h-36 border-4 border-dashed border-[var(--color-border-secondary)] hover:border-[var(--color-positive)] hover:text-[var(--color-positive)] text-[var(--color-text-muted)] rounded-none bg-[var(--color-bg-secondary)]/50 flex flex-col items-center justify-center text-center transition-colors"
                >
                    <AddIcon />
                    <span className="mt-1 text-xs font-bold">Add New</span>
                </button>
            )}
        </div>
      </footer>
    </div>
  );
};

export default TemplateSelection;
