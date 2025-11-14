
import React, { useState } from 'react';
import { Settings } from '../types';
import { BackIcon } from './icons/BackIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TicketIcon } from './icons/TicketIcon';
import { InfoIcon } from './icons/InfoIcon';
import KioskGuide from './KioskGuide';
import { SettingsIcon } from './icons/SettingsIcon';
import { EyeIcon } from './icons/EyeIcon';
import { FolderIcon } from './icons/FolderIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface SettingsScreenProps {
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
    onManageTemplates: () => void;
    onManageEvents: () => void;
    onManageSessions: () => void;
    onViewHistory: () => void;
    onManageOnlineHistory: () => void;
    onBack: () => void;
}

export const GOOGLE_FONTS = [
  { name: 'Bebas Neue (Default)', value: "'Bebas Neue', sans-serif" },
  { name: 'Poppins (Default)', value: "'Poppins', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Lora', value: "'Lora', serif" },
  { name: 'Oswald', value: "'Oswald', sans-serif" },
  { name: 'Lobster', value: "'Lobster', cursive" },
  { name: 'Pacifico', value: "'Pacifico', cursive" },
  { name: 'Caveat', value: "'Caveat', cursive" },
  { name: 'Roboto Mono', value: "'Roboto Mono', monospace" },
];

type SettingsCategory = 'general' | 'appearance' | 'security' | 'content';

const CategoryButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 text-left p-3 rounded-lg transition-colors text-lg ${
      isActive
        ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)] font-bold'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);


const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSettingsChange, onManageTemplates, onManageEvents, onManageSessions, onViewHistory, onManageOnlineHistory, onBack }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: string | number | boolean = value;
    
    if (type === 'checkbox' && 'checked' in e.target) {
        finalValue = e.target.checked;
    } else if (type === 'number' || type === 'range') {
        finalValue = parseInt(value, 10) || 0;
    }

    onSettingsChange({
      ...settings,
      [name]: finalValue,
    });
  };
  
  const handleThemeChange = (theme: 'light' | 'dark') => {
    onSettingsChange({ ...settings, theme });
  };
  
  const handleResetSetting = (name: keyof Settings) => {
    onSettingsChange({ ...settings, [name]: '' });
  };

  const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (/^\d{0,4}$/.test(value)) {
        onSettingsChange({ ...settings, fullscreenPin: value });
    }
  };

  const handleResetPin = () => {
    if (window.confirm("Are you sure you want to reset the PIN to '1234'?")) {
        onSettingsChange({ ...settings, fullscreenPin: '1234' });
    }
  };

  const renderContent = () => {
    switch(activeCategory) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Session Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">General Settings</h3>
                <div>
                  <label htmlFor="countdownDuration" className="block text-sm font-medium text-[var(--color-text-secondary)]">Countdown Duration (seconds)</label>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">How long the countdown lasts before each photo is taken.</p>
                  <input
                      type="number"
                      id="countdownDuration"
                      name="countdownDuration"
                      value={settings.countdownDuration}
                      onChange={handleSettingsInputChange}
                      min="0"
                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                  />
                </div>
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="flashEffectEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Flash Effect</span>
                          <p className="text-xs text-[var(--color-text-muted)]">Shows a white flash on screen when a photo is taken.</p>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="flashEffectEnabled"
                              name="flashEffectEnabled"
                              checked={settings.flashEffectEnabled}
                              onChange={handleSettingsInputChange}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
            </div>
            
             {/* Download Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Download Settings</h3>
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isAutoDownloadEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Automatic Download</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Automatically start download on preview screen.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="isAutoDownloadEnabled"
                            name="isAutoDownloadEnabled"
                            checked={settings.isAutoDownloadEnabled ?? true}
                            onChange={handleSettingsInputChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
               <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isDownloadButtonEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show Manual Download Button</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Display a button for users to download manually.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="isDownloadButtonEnabled"
                            name="isDownloadButtonEnabled"
                            checked={settings.isDownloadButtonEnabled ?? true}
                            onChange={handleSettingsInputChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
            </div>

            {/* Print Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Print Settings</h3>
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isPrintButtonEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Print Button</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Show a 'Print' button on the final preview screen.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isPrintButtonEnabled" name="isPrintButtonEnabled" checked={settings.isPrintButtonEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>

              {(settings.isPrintButtonEnabled ?? true) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                      <div>
                        <label htmlFor="printPaperSize" className="block text-sm font-medium text-[var(--color-text-secondary)]">Paper Size</label>
                        <select id="printPaperSize" name="printPaperSize" value={settings.printPaperSize ?? '4x6'} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                          <option value="4x6">4x6 inch</option>
                          <option value="A4_portrait">A4 Portrait</option>
                          <option value="A4_landscape">A4 Landscape</option>
                        </select>
                      </div>
                       <div>
                        <label htmlFor="printColorMode" className="block text-sm font-medium text-[var(--color-text-secondary)]">Color Mode</label>
                        <select id="printColorMode" name="printColorMode" value={settings.printColorMode ?? 'color'} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                          <option value="color">Color</option>
                          <option value="grayscale">Grayscale</option>
                        </select>
                      </div>
                  </div>
                   <div className="border-t border-[var(--color-border-primary)] pt-4">
                      <label htmlFor="isPrintCopyInputEnabled" className="flex items-center justify-between cursor-pointer">
                          <div>
                              <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show 'Number of Copies' Option</span>
                              <p className="text-xs text-[var(--color-text-muted)]">Allow users to choose how many copies to print.</p>
                          </div>
                          <div className="relative">
                              <input type="checkbox" id="isPrintCopyInputEnabled" name="isPrintCopyInputEnabled" checked={settings.isPrintCopyInputEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                              <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                          </div>
                      </label>
                  </div>
                  {(settings.isPrintCopyInputEnabled ?? true) && (
                     <div className="border-t border-[var(--color-border-primary)] pt-4">
                        <label htmlFor="printMaxCopies" className="block text-sm font-medium text-[var(--color-text-secondary)]">Maximum Copies per Print</label>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Set the maximum number of copies a user can select.</p>
                        <input type="number" id="printMaxCopies" name="printMaxCopies" value={settings.printMaxCopies ?? 5} onChange={handleSettingsInputChange} min="1" className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case 'appearance':
        return (
           <div className="space-y-6">
             {/* Welcome Screen Text Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Text</h3>
              <div>
                <label htmlFor="welcomeTitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Main Title</label>
                <input
                    type="text"
                    id="welcomeTitle"
                    name="welcomeTitle"
                    value={settings.welcomeTitle || ''}
                    onChange={handleSettingsInputChange}
                    placeholder="e.g., SANS PHOTO"
                    className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="welcomeSubtitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle</label>
                <input
                    type="text"
                    id="welcomeSubtitle"
                    name="welcomeSubtitle"
                    value={settings.welcomeSubtitle || ''}
                    onChange={handleSettingsInputChange}
                    placeholder="e.g., Your personal web photobooth"
                    className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeTitleColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Title Color</label>
                        <button onClick={() => handleResetSetting('welcomeTitleColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                      </div>
                      <input type="color" id="welcomeTitleColor" name="welcomeTitleColor" value={settings.welcomeTitleColor || '#F9FAFB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                  </div>
                  <div>
                       <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeSubtitleColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle Color</label>
                        <button onClick={() => handleResetSetting('welcomeSubtitleColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                      </div>
                      <input type="color" id="welcomeSubtitleColor" name="welcomeSubtitleColor" value={settings.welcomeSubtitleColor || '#D1D5DB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                  </div>
              </div>

               <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeTitleFont" className="block text-sm font-medium text-[var(--color-text-secondary)]">Title Font</label>
                    <select id="welcomeTitleFont" name="welcomeTitleFont" value={settings.welcomeTitleFont} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                  <label htmlFor="isWelcomeTitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Randomize Title Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeTitleFontRandom" name="isWelcomeTitleFontRandom" checked={settings.isWelcomeTitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                  </label>
                </div>
                <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeSubtitleFont" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle Font</label>
                    <select id="welcomeSubtitleFont" name="welcomeSubtitleFont" value={settings.welcomeSubtitleFont} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                   <label htmlFor="isWelcomeSubtitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Randomize Subtitle Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeSubtitleFontRandom" name="isWelcomeSubtitleFontRandom" checked={settings.isWelcomeSubtitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                  </label>
                </div>

              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isWelcomeTextShadowEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Text Shadow</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Adds a drop shadow for better readability.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="isWelcomeTextShadowEnabled"
                            name="isWelcomeTextShadowEnabled"
                            checked={settings.isWelcomeTextShadowEnabled ?? true}
                            onChange={handleSettingsInputChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
            </div>

            {/* Welcome Screen Background Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Background</h3>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Type</label>
                <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-lg bg-[var(--color-bg-tertiary)] p-1">
                  {(['default', 'color', 'image', 'camera'] as const).map(type => (
                    <label key={type} className={`block text-center cursor-pointer rounded-md py-2 px-3 text-sm font-semibold transition-colors ${settings.welcomeBgType === type ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : 'hover:bg-[var(--color-bg-primary)]'}`}>
                      <input type="radio" name="welcomeBgType" value={type} checked={settings.welcomeBgType === type} onChange={handleSettingsInputChange} className="sr-only"/>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {settings.welcomeBgType === 'color' && (
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="welcomeBgColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Color</label>
                  <input type="color" id="welcomeBgColor" name="welcomeBgColor" value={settings.welcomeBgColor || '#111827'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                </div>
              )}

              {settings.welcomeBgType === 'image' && (
                <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeBgImageUrl" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Image URL</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Use a direct image link. For Google Photos, use an embed link.</p>
                    <input
                        type="url"
                        id="welcomeBgImageUrl"
                        name="welcomeBgImageUrl"
                        value={settings.welcomeBgImageUrl || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="https://..."
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                  </div>
                </div>
              )}
              
              {(settings.welcomeBgType === 'color' || settings.welcomeBgType === 'image' || settings.welcomeBgType === 'camera') && (
                 <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="welcomeBgZoom" className="block text-sm font-medium text-[var(--color-text-secondary)]">Zoom ({settings.welcomeBgZoom || 100}%)</label>
                  <input
                    id="welcomeBgZoom"
                    name="welcomeBgZoom"
                    type="range"
                    min="100"
                    max="300"
                    value={settings.welcomeBgZoom || 100}
                    onChange={handleSettingsInputChange}
                    className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            
             {/* Start Button Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Start Button</h3>
                <div>
                    <label htmlFor="startButtonText" className="block text-sm font-medium text-[var(--color-text-secondary)]">Button Text</label>
                    <input
                        type="text"
                        id="startButtonText"
                        name="startButtonText"
                        value={settings.startButtonText || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="e.g., START SESSION"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonBgColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Color</label>
                            <button onClick={() => handleResetSetting('startButtonBgColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                        </div>
                        <input type="color" id="startButtonBgColor" name="startButtonBgColor" value={settings.startButtonBgColor || '#8B5CF6'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonTextColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Text Color</label>
                            <button onClick={() => handleResetSetting('startButtonTextColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                        </div>
                        <input type="color" id="startButtonTextColor" name="startButtonTextColor" value={settings.startButtonTextColor || '#FFFFFF'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                    </div>
                </div>
                
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="isStartButtonShadowEnabled" className="flex items-center justify-between cursor-pointer">
                        <div>
                            <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Button Shadow</span>
                            <p className="text-xs text-[var(--color-text-muted)]">Adds a drop shadow to the start button.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="isStartButtonShadowEnabled"
                                name="isStartButtonShadowEnabled"
                                checked={settings.isStartButtonShadowEnabled ?? true}
                                onChange={handleSettingsInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Theme Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">App Theme</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 font-bold py-2 px-4 rounded-md transition-colors ${settings.theme === 'dark' || !settings.theme ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)]'}`}
                >
                  Dark Mode
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 font-bold py-2 px-4 rounded-md transition-colors ${settings.theme === 'light' ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)]'}`}
                >
                  Light Mode
                </button>
              </div>
            </div>
           </div>
        );
      case 'security':
        return (
           <div className="space-y-6">
             {/* Security Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)] flex items-center gap-2"><KeyIcon /> Security Settings</h3>
              
              {/* PIN Lock */}
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isPinLockEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable PIN to Exit Fullscreen</span>
                          <p className="text-xs text-[var(--color-text-muted)]">Requires a PIN to exit fullscreen mode.</p>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="isPinLockEnabled"
                              name="isPinLockEnabled"
                              checked={settings.isPinLockEnabled || false}
                              onChange={handleSettingsInputChange}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
              </div>
              {settings.isPinLockEnabled && (
                  <div className="pt-4 space-y-2">
                      <label htmlFor="fullscreenPin" className="block text-sm font-medium text-[var(--color-text-secondary)]">Set 4-Digit PIN</label>
                      <div className="flex items-center gap-2">
                          <input
                              type="password"
                              id="fullscreenPin"
                              name="fullscreenPin"
                              value={settings.fullscreenPin || ''}
                              onChange={handlePinInputChange}
                              maxLength={4}
                              pattern="\d{4}"
                              title="PIN must be 4 digits"
                              className="flex-grow block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm tracking-[1em] text-center"
                          />
                          <button
                              onClick={handleResetPin}
                              className="bg-[var(--color-accent-secondary)] hover:bg-[var(--color-accent-secondary-hover)] text-[var(--color-accent-secondary-text)] font-bold py-2 px-4 rounded-md text-sm"
                          >
                              Reset
                          </button>
                      </div>
                  </div>
              )}

              {/* Strict Kiosk Mode */}
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isStrictKioskMode" className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                          <div>
                              <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Strict Kiosk Mode</span>
                              <p className="text-xs text-[var(--color-text-muted)]">Aggressively tries to prevent exiting fullscreen. <span className="font-bold">Recommended.</span></p>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsGuideOpen(true); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-accent)]"><InfoIcon /></button>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="isStrictKioskMode"
                              name="isStrictKioskMode"
                              checked={settings.isStrictKioskMode || false}
                              onChange={handleSettingsInputChange}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
              </div>
            </div>
           </div>
        );
      case 'content':
         return (
          <div className="space-y-6">
            {/* Session Code Management */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Session Management</h3>
                
                {/* Enable/Disable Session Code */}
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isSessionCodeEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Session Code</span>
                          <p className="text-xs text-[var(--color-text-muted)]">If disabled, users can start sessions without a code (free play mode).</p>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="isSessionCodeEnabled"
                              name="isSessionCodeEnabled"
                              checked={settings.isSessionCodeEnabled ?? true}
                              onChange={handleSettingsInputChange}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
                
                {!(settings.isSessionCodeEnabled ?? true) && (
                  <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="freePlayMaxTakes" className="block text-sm font-medium text-[var(--color-text-secondary)]">Takes per Free Session</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Number of photo takes a user gets in free play mode.</p>
                    <input
                        type="number"
                        id="freePlayMaxTakes"
                        name="freePlayMaxTakes"
                        value={settings.freePlayMaxTakes || 1}
                        onChange={handleSettingsInputChange}
                        min="1"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <p className="text-[var(--color-text-muted)] mb-4 text-sm">
                    Generate and manage single-use session codes for users to start the photobooth.
                  </p>
                  <button
                    onClick={onManageSessions}
                    className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <TicketIcon />
                    Manage Session Codes
                  </button>
                </div>
              </div>
            
            {/* Online History */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Online History</h3>
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isOnlineHistoryEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Online History</span>
                          <p className="text-xs text-[var(--color-text-muted)]">Show a button on the welcome screen for users to view an online gallery.</p>
                      </div>
                      <div className="relative">
                          <input type="checkbox" id="isOnlineHistoryEnabled" name="isOnlineHistoryEnabled" checked={settings.isOnlineHistoryEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
                <div className="pt-4">
                  <button
                    onClick={onManageOnlineHistory}
                    className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <GlobeIcon />
                    Manage Online History
                  </button>
                </div>
            </div>

             {/* Event Management */}
              <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                <h3 className="text-xl font-bold mb-4 text-[var(--color-text-accent)]">Event Management</h3>
                <p className="text-[var(--color-text-muted)] mb-4">
                  Create, manage, and archive events. Assign specific templates to each event.
                </p>
                <button
                  onClick={onManageEvents}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                >
                  Manage Events
                </button>
              </div>

              {/* Template Settings */}
              <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                <h3 className="text-xl font-bold mb-4 text-[var(--color-text-accent)]">Template Library</h3>
                <p className="text-[var(--color-text-muted)] mb-4">
                  Add, edit, or delete photobooth templates from your global library.
                </p>
                <button
                  onClick={onManageTemplates}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                >
                  Manage All Templates
                </button>
              </div>
              
              {/* History */}
              <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                  <h3 className="text-xl font-bold mb-4 text-[var(--color-text-accent)]">Photobooth History (Local)</h3>
                  <p className="text-[var(--color-text-muted)] mb-4">
                      View, filter, and manage all photos taken during events on this device.
                  </p>
                  <button
                      onClick={onViewHistory}
                      className="w-full bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
                  >
                      View Local History
                  </button>
              </div>
          </div>
         );
      default:
        return null;
    }
  }

  return (
    <>
      {isGuideOpen && <KioskGuide onClose={() => setIsGuideOpen(false)} />}
      <div className="relative flex flex-col items-center w-full h-full">
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
          >
            <BackIcon />
          </button>
        </div>
        
        <header className="text-center shrink-0 my-4">
            <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Admin Settings</h2>
        </header>
        
        <div className="w-full max-w-6xl mx-auto flex-grow flex flex-col md:flex-row gap-8 overflow-hidden px-4 pb-4">
            {/* Left Navigation */}
            <nav className="w-full md:w-1/4 lg:w-1/5 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
               <CategoryButton 
                 label="General"
                 icon={<SettingsIcon />}
                 isActive={activeCategory === 'general'}
                 onClick={() => setActiveCategory('general')}
               />
               <CategoryButton 
                 label="Appearance"
                 icon={<EyeIcon />}
                 isActive={activeCategory === 'appearance'}
                 onClick={() => setActiveCategory('appearance')}
               />
                <CategoryButton 
                 label="Security"
                 icon={<KeyIcon />}
                 isActive={activeCategory === 'security'}
                 onClick={() => setActiveCategory('security')}
               />
                <CategoryButton 
                 label="Content"
                 icon={<FolderIcon />}
                 isActive={activeCategory === 'content'}
                 onClick={() => setActiveCategory('content')}
               />
            </nav>

            {/* Right Content */}
            <main className="w-full md:w-3/4 lg:w-4/5 flex-grow overflow-y-auto scrollbar-thin md:pr-2">
                {renderContent()}
            </main>
        </div>

      </div>
    </>
  );
};

export default SettingsScreen;
