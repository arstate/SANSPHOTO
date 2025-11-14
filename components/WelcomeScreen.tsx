
import React from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AdminIcon } from './icons/AdminIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface WelcomeScreenProps {
  onStart: () => void;
  onSettingsClick: () => void;
  onViewHistory: () => void;
  isAdminLoggedIn: boolean;
  isCaching: boolean;
  cachingProgress: number;
  onAdminLoginClick: () => void;
  onAdminLogoutClick: () => void;
  isLoading: boolean;
}

const CachingStatus: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-[var(--color-bg-secondary)]/80 backdrop-blur-sm z-50 transition-opacity duration-300">
        <div className="max-w-md mx-auto text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Downloading templates for offline use...</p>
            <div className="w-full bg-[var(--color-border-secondary)] rounded-full h-2.5">
                <div 
                    className="bg-[var(--color-accent-primary)] h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-xs font-mono mt-1 text-[var(--color-text-accent)]">{Math.round(progress)}%</p>
        </div>
    </div>
);


const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onStart, 
    onSettingsClick, 
    onViewHistory, 
    isAdminLoggedIn, 
    isCaching, 
    cachingProgress,
    onAdminLoginClick,
    onAdminLogoutClick,
    isLoading
}) => {
  return (
    <div className="relative text-center flex flex-col items-center justify-center h-full w-full">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={isAdminLoggedIn ? onAdminLogoutClick : onAdminLoginClick}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label={isAdminLoggedIn ? 'Admin Logout' : 'Admin Login'}
        >
          {isAdminLoggedIn ? <LogoutIcon /> : <AdminIcon />}
        </button>
      </div>

      <h1 className="font-bebas text-8xl md:text-9xl tracking-widest text-[var(--color-text-primary)] animate-pulse">SANS PHOTO</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Your personal web photobooth</p>
      {isAdminLoggedIn ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={onSettingsClick}
                className="bg-[var(--color-accent-secondary)] hover:bg-[var(--color-accent-secondary-hover)] text-[var(--color-accent-secondary-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-[var(--color-accent-secondary)]/50 flex items-center gap-2"
            >
                <SettingsIcon />
                Settings
            </button>
            <button
                onClick={onViewHistory}
                className="bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-[var(--color-info)]/50 flex items-center gap-2"
            >
                <HistoryIcon />
                View History
            </button>
          </div>
      ) : (
        <button
          onClick={onStart}
          disabled={isLoading || isCaching}
          className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-[var(--color-accent-primary)]/50 disabled:bg-[var(--color-bg-tertiary)] disabled:transform-none disabled:cursor-wait"
        >
          {isLoading ? 'Starting...' : 'START SESSION'}
        </button>
      )}
      
      {isCaching && <CachingStatus progress={cachingProgress} />}
    </div>
  );
};

export default WelcomeScreen;