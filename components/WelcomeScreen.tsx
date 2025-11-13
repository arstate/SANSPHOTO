
import React from 'react';
import { AdminIcon } from './icons/AdminIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';

interface WelcomeScreenProps {
  onStart: () => void;
  onAdminLoginClick: () => void;
  onAdminLogout: () => void;
  onSettingsClick: () => void;
  onViewHistory: () => void;
  isAdminLoggedIn: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onAdminLoginClick, onAdminLogout, onSettingsClick, onViewHistory, isAdminLoggedIn }) => {
  return (
    <div className="relative text-center flex flex-col items-center justify-center h-screen">
      <div className="absolute top-4 right-4">
        <button 
          onClick={isAdminLoggedIn ? onAdminLogout : onAdminLoginClick}
          className="bg-gray-800/50 hover:bg-gray-700/70 text-white font-bold p-3 rounded-full transition-colors"
          aria-label={isAdminLoggedIn ? 'Admin Logout' : 'Admin Login'}
        >
          {isAdminLoggedIn ? <LogoutIcon /> : <AdminIcon />}
        </button>
      </div>
      <h1 className="font-bebas text-8xl md:text-9xl tracking-widest text-white animate-pulse">SANS PHOTO</h1>
      <p className="text-gray-400 mb-8">Your personal web photobooth</p>
      {isAdminLoggedIn ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={onSettingsClick}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-yellow-500/50 flex items-center gap-2"
            >
                <SettingsIcon />
                Settings
            </button>
            <button
                onClick={onViewHistory}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-blue-500/50 flex items-center gap-2"
            >
                <HistoryIcon />
                View History
            </button>
          </div>
      ) : (
        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-purple-500/50"
        >
          START SESSION
        </button>
      )}
    </div>
  );
};

export default WelcomeScreen;