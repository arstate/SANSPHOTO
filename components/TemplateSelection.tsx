
import React, { useState, useEffect } from 'react';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Template } from '../types';
import { getCachedImage } from '../utils/db';

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

const getProxiedUrl = (url: string) => {
    if (!url || !url.startsWith('http')) {
        return url;
    }
    // Gunakan api.allorigins.win untuk melewati masalah CORS.
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
};

const ImageFromCache: React.FC<{ src: string; alt: string; className: string; }> = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      setIsLoading(true);
      setImageSrc(null);
      if (!src) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      try {
        const cachedBlob = await getCachedImage(src);
        if (isMounted) {
            if (cachedBlob) {
              objectUrl = URL.createObjectURL(cachedBlob);
              setImageSrc(objectUrl);
            } else {
              // Fallback to network if not in cache
              setImageSrc(getProxiedUrl(src));
            }
        }
      } catch (error) {
        console.error("Error loading image:", error);
        // Fallback in case of DB error
        if (isMounted) setImageSrc(getProxiedUrl(src));
      } finally {
        if (isMounted) setIsLoading(false);
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

  if (isLoading) {
    return <div className={`bg-gray-700 animate-pulse ${className}`}></div>;
  }
  
  if (!imageSrc) {
    return <div className={`bg-gray-800 flex items-center justify-center text-xs text-gray-500 ${className}`}>Image not available</div>;
  }

  return <img src={imageSrc} alt={alt} className={className} loading="lazy" />;
};


const TemplateSelection: React.FC<TemplateSelectionProps> = ({ 
  templates, onSelect, onBack, isAdminLoggedIn, onAddTemplate, onEditMetadata, onEditLayout, onDelete 
}) => {
  const [previewedTemplate, setPreviewedTemplate] = useState<Template | null>(templates[0] || null);

  useEffect(() => {
    // If templates change (e.g., one is deleted or list is filtered) and the previewed one is gone,
    // reset to the first available template in the new list.
    if (!previewedTemplate || !templates.find(t => t.id === previewedTemplate.id)) {
      setPreviewedTemplate(templates[0] || null);
    }
  }, [templates, previewedTemplate]);

  return (
    <div className="relative flex flex-col h-full w-full">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={onBack}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>
      
      <header className="text-center shrink-0 my-4 px-4">
        <h2 className="text-4xl font-bebas tracking-wider text-white">
          {isAdminLoggedIn ? 'Manage All Templates' : 'Choose Your Template'}
        </h2>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full min-h-0 px-4">
        {previewedTemplate ? (
            <div className={`group relative w-full ${previewedTemplate.orientation === 'landscape' ? 'max-w-2xl' : 'max-w-xs'} border-4 border-gray-700 rounded-lg p-2 bg-gray-800 flex flex-col text-center`}>
                <div className="relative">
                    <ImageFromCache 
                        src={previewedTemplate.imageUrl} 
                        alt={previewedTemplate.name}
                        className={`rounded-md shadow-lg w-full ${previewedTemplate.orientation === 'landscape' ? 'aspect-[3/2]' : 'aspect-[2/3]'} object-cover`}
                    />
                    {isAdminLoggedIn && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => onEditLayout(previewedTemplate)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                            >
                                Edit Layout
                            </button>
                        </div>
                    )}
                </div>
                <div className="mt-2">
                    <p className="text-gray-300 font-semibold">{previewedTemplate.name}</p>
                    <p className="text-xs text-gray-500">{previewedTemplate.widthMM}mm x {previewedTemplate.heightMM}mm</p>
                </div>
                {isAdminLoggedIn ? (
                    <div className="mt-2 pt-2 border-t border-gray-700 flex justify-center gap-2">
                        <button onClick={() => onEditMetadata(previewedTemplate)} className="text-gray-400 hover:text-white p-2" aria-label="Edit Details"><EditIcon /></button>
                        <button onClick={() => {
                            if (window.confirm('Are you sure you want to delete this template permanently?')) {
                                onDelete(previewedTemplate.id)
                            }
                        }} className="text-gray-400 hover:text-red-500 p-2" aria-label="Delete Template"><TrashIcon /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => onSelect(previewedTemplate)}
                        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-md transition-transform transform hover:scale-105 w-full"
                    >
                        Use This Template
                    </button>
                )}
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
                <p>{isAdminLoggedIn ? "No templates found. Add one below!" : "No templates available for this event."}</p>
            </div>
        )}
      </main>

      <footer className="w-full shrink-0 pt-6">
        <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-thin px-4">
            {templates.map(template => (
                <button
                    key={template.id}
                    onClick={() => setPreviewedTemplate(template)}
                    className={`relative shrink-0 ${template.orientation === 'landscape' ? 'w-[13.5rem] h-36' : 'w-24 h-36'} rounded-md overflow-hidden border-4 transition-colors ${previewedTemplate?.id === template.id ? 'border-purple-500' : 'border-gray-700 hover:border-gray-500'}`}
                    aria-label={`Select ${template.name}`}
                >
                    <ImageFromCache 
                        src={template.imageUrl} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                    {isAdminLoggedIn && !template.eventId && (
                        <div className="absolute top-0 right-0 p-1 bg-yellow-500/80 rounded-bl-md" title="Unassigned">
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
                    className="shrink-0 w-24 h-36 border-4 border-dashed border-gray-600 hover:border-green-500 hover:text-green-400 text-gray-500 rounded-lg bg-gray-800/50 flex flex-col items-center justify-center text-center transition-colors"
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
