
import React, { useState } from 'react';
import { Settings } from '../types';
import { BackIcon } from './icons/BackIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TicketIcon } from './icons/TicketIcon';
import { InfoIcon } from './icons/InfoIcon';
import KioskGuide from './KioskGuide';

interface SettingsScreenProps {
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
    onManageTemplates: () => void;
    onManageEvents: () => void;
    onManageSessions: () => void;
    onViewHistory: () => void;
    onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSettingsChange, onManageTemplates, onManageEvents, onManageSessions, onViewHistory, onBack }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue: string | number | boolean = value;
    if (type === 'checkbox') {
        finalValue = checked;
    } else if (type === 'number') {
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

  return (
    <>
      {isGuideOpen && <KioskGuide onClose={() => setIsGuideOpen(false)} />}
      <div className="relative text-center flex flex-col items-center w-full h-full">
        <div className="absolute top-4 left-4">
          <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
          >
            <BackIcon />
          </button>
        </div>
        
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-8 shrink-0">Admin Settings</h2>

        <div className="w-full max-w-md space-y-6 overflow-y-auto scrollbar-thin pr-2">
          {/* Welcome Screen Customization */}
          <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
            <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Customization</h3>
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
          </div>
          
          {/* Theme Settings */}
          <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
            <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Theme</h3>
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
              <h3 className="text-xl font-bold mb-4 text-[var(--color-text-accent)]">Photobooth History</h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                  View, filter, and manage all photos taken during events.
              </p>
              <button
                  onClick={onViewHistory}
                  className="w-full bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
              >
                  View Photobooth History
              </button>
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
      </div>
    </>
  );
};

export default SettingsScreen;