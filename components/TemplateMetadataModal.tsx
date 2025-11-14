import React, { useState, useEffect } from 'react';
import { Template } from '../types';

interface TemplateMetadataModalProps {
  template: Template;
  onSave: (template: Template) => void;
  onClose: () => void;
}

const TemplateMetadataModal: React.FC<TemplateMetadataModalProps> = ({ template, onSave, onClose }) => {
  const [currentTemplate, setCurrentTemplate] = useState<Template>(template);
  const isNew = !template.imageUrl; // A simple check to see if it's a new template

  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setCurrentTemplate(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentTemplate);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-lg border border-[var(--color-border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-6">{isNew ? 'Add New Template' : 'Edit Template Details'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Template Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={currentTemplate.name}
              onChange={handleChange}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Template Image URL</label>
             <p className="text-xs text-[var(--color-text-muted)] mb-2">Use a direct image link. For Google Photos, use the embed link.</p>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={currentTemplate.imageUrl}
              onChange={handleChange}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              placeholder="https://..."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="widthMM" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Width (mm)</label>
                <input
                  id="widthMM"
                  name="widthMM"
                  type="number"
                  value={currentTemplate.widthMM}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                  required
                />
            </div>
            <div>
                <label htmlFor="heightMM" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Height (mm)</label>
                <input
                  id="heightMM"
                  name="heightMM"
                  type="number"
                  value={currentTemplate.heightMM}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                  required
                />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Orientation</label>
            <div className="flex gap-4 p-2 bg-[var(--color-bg-tertiary)] rounded-md">
                <label className={`flex-1 text-center items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${currentTemplate.orientation === 'portrait' ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : ''}`}>
                    <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={currentTemplate.orientation === 'portrait'}
                        onChange={handleChange}
                        className="sr-only"
                    />
                    <span>Portrait</span>
                </label>
                <label className={`flex-1 text-center items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${currentTemplate.orientation === 'landscape' ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : ''}`}>
                    <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={currentTemplate.orientation === 'landscape'}
                        onChange={handleChange}
                        className="sr-only"
                    />
                    <span>Landscape</span>
                </label>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <button type="submit" className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-4 rounded-full text-lg">
              Save Template
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateMetadataModal;