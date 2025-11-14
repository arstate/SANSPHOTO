
import React, { useMemo, useRef, useEffect } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AdminIcon } from './icons/AdminIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { Settings } from '../types';

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
  settings: Settings;
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
    isLoading,
    settings
}) => {
  const { 
    welcomeTitle = 'SANS PHOTO', 
    welcomeSubtitle = 'Your personal web photobooth',
    welcomeTitleColor,
    welcomeSubtitleColor,
    welcomeBgType = 'default',
    welcomeBgColor,
    welcomeBgImageUrl,
    welcomeBgZoom = 100,
    isWelcomeTextShadowEnabled = true,
  } = settings;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const startCamera = async () => {
      if (videoElement) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
          });
          videoElement.srcObject = stream;
        } catch (err) {
          console.error("Error accessing camera for background:", err);
        }
      }
    };

    const stopCamera = () => {
        if (videoElement && videoElement.srcObject) {
            const currentStream = videoElement.srcObject as MediaStream;
            currentStream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    };

    if (welcomeBgType === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [welcomeBgType]);


  const backgroundStyles = useMemo(() => {
    switch (welcomeBgType) {
      case 'color':
        return { backgroundColor: welcomeBgColor };
      case 'image':
        const imageUrl = welcomeBgImageUrl?.startsWith('http') 
          ? `https://api.allorigins.win/raw?url=${encodeURIComponent(welcomeBgImageUrl)}` 
          : welcomeBgImageUrl;
        return {
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: `${welcomeBgZoom}%`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      case 'camera':
      case 'default':
      default:
        return { backgroundColor: 'var(--color-bg-primary)'};
    }
  }, [welcomeBgType, welcomeBgColor, welcomeBgImageUrl, welcomeBgZoom]);

  return (
    <div 
        className="relative text-center flex flex-col items-center justify-center h-full w-full transition-colors duration-300 overflow-hidden"
        style={backgroundStyles}
    >
      {welcomeBgType === 'camera' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-transform duration-300"
          style={{ transform: `-scaleX(1) scale(${welcomeBgZoom / 100})` }}
        />
      )}
      {(welcomeBgType === 'image' || welcomeBgType === 'camera') && (
        <div className="absolute inset-0 bg-black/30" />
      )}
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4">
        <div className="absolute top-4 left-4">
          <button 
            onClick={isAdminLoggedIn ? onAdminLogoutClick : onAdminLoginClick}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label={isAdminLoggedIn ? 'Admin Logout' : 'Admin Login'}
          >
            {isAdminLoggedIn ? <LogoutIcon /> : <AdminIcon />}
          </button>
        </div>

        <h1 
          className="font-bebas text-8xl md:text-9xl tracking-widest text-white animate-pulse"
          style={{
            color: welcomeTitleColor || undefined,
            textShadow: isWelcomeTextShadowEnabled ? '2px 2px 8px rgba(0,0,0,0.7)' : 'none',
          }}
        >
          {welcomeTitle}
        </h1>
        <p 
          className="text-gray-200 mb-8"
          style={{
            color: welcomeSubtitleColor || undefined,
            textShadow: isWelcomeTextShadowEnabled ? '1px 1px 4px rgba(0,0,0,0.7)' : 'none',
          }}
        >
          {welcomeSubtitle}
        </p>
        {isAdminLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                  onClick={onSettingsClick}
                  className="bg-[var(--color-accent-secondary)] hover:bg-[var(--color-accent-secondary-hover)] text-[var(--color-accent-secondary-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-black/50 flex items-center gap-2"
              >
                  <SettingsIcon />
                  Settings
              </button>
              <button
                  onClick={onViewHistory}
                  className="bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-black/50 flex items-center gap-2"
              >
                  <HistoryIcon />
                  View History
              </button>
            </div>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading || isCaching}
            className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-black/50 disabled:bg-[var(--color-bg-tertiary)] disabled:transform-none disabled:cursor-wait"
          >
            {isLoading ? 'Starting...' : 'START SESSION'}
          </button>
        )}
      </div>
      
      {isCaching && <CachingStatus progress={cachingProgress} />}
    </div>
  );
};

export default WelcomeScreen;