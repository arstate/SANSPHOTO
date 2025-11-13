
import React from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';

interface WelcomeScreenProps {
  onStart: () => void;
  onSettingsClick: () => void;
  onViewHistory: () => void;
  isAdminLoggedIn: boolean;
  isCaching: boolean;
  cachingProgress: number;
}

const CachingStatus: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-gray-800/80 backdrop-blur-sm z-50 transition-opacity duration-300">
        <div className="max-w-md mx-auto text-center">
            <p className="text-sm text-gray-300 mb-1">Downloading templates for offline use...</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div 
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-xs font-mono mt-1 text-purple-300">{Math.round(progress)}%</p>
        </div>
    </div>
);


const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onSettingsClick, onViewHistory, isAdminLoggedIn, isCaching, cachingProgress }) => {
  return (
    <div className="relative text-center flex flex-col items-center justify-center h-full w-full">
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
      
      {isCaching && <CachingStatus progress={cachingProgress} />}
    </div>
  );
};

export default WelcomeScreen;
