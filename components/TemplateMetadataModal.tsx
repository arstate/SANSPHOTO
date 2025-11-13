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
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-6">{isNew ? 'Add New Template' : 'Edit Template Details'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold mb-2 text-gray-300">Template Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={currentTemplate.name}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-bold mb-2 text-gray-300">Template Image URL</label>
             <p className="text-xs text-gray-500 mb-2">Use a direct image link. For Google Photos, use the embed link.</p>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={currentTemplate.imageUrl}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://..."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="widthMM" className="block text-sm font-bold mb-2 text-gray-300">Width (mm)</label>
                <input
                  id="widthMM"
                  name="widthMM"
                  type="number"
                  value={currentTemplate.widthMM}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
            </div>
            <div>
                <label htmlFor="heightMM" className="block text-sm font-bold mb-2 text-gray-300">Height (mm)</label>
                <input
                  id="heightMM"
                  name="heightMM"
                  type="number"
                  value={currentTemplate.heightMM}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full text-lg">
              Save Template
            </button>
            <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateMetadataModal;
