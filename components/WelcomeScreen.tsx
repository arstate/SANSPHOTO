




import React, { useMemo, useRef, useEffect, useState } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AdminIcon } from './icons/AdminIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { Settings, Review } from '../types';
import { GOOGLE_FONTS } from './SettingsScreen'; 
import ReviewSlider from './ReviewSlider';
import { ThreeCamera } from './ThreeCamera';

interface WelcomeScreenProps {
  onStart: () => void;
  onSettingsClick: () => void;
  onViewHistory: () => void;
  onViewOnlineHistory: () => void;
  isAdminLoggedIn: boolean;
  isCaching: boolean;
  cachingProgress: number;
  onAdminLoginClick: () => void;
  onAdminLogoutClick: () => void;
  isLoading: boolean;
  settings: Settings;
  reviews: Review[];
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
    onViewOnlineHistory,
    isAdminLoggedIn, 
    isCaching, 
    cachingProgress,
    onAdminLoginClick,
    onAdminLogoutClick,
    isLoading,
    settings,
    reviews
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
    welcomeTitleFont = "'Bebas Neue', sans-serif",
    welcomeSubtitleFont = "'Poppins', sans-serif",
    isWelcomeTitleFontRandom = false,
    isWelcomeSubtitleFontRandom = false,
    startButtonText = 'START SESSION',
    startButtonBgColor,
    startButtonTextColor,
    isStartButtonShadowEnabled = true,
    isOnlineHistoryButtonIconEnabled = true,
    onlineHistoryButtonText = 'History',
    isOnlineHistoryButtonFillEnabled = false,
    onlineHistoryButtonFillColor,
    onlineHistoryButtonTextColor,
    isOnlineHistoryButtonStrokeEnabled = true,
    onlineHistoryButtonStrokeColor,
    isOnlineHistoryButtonShadowEnabled = true,
    
    // Floating Camera
    isFloatingCameraEnabled = false,
    floatingCameraX = 85,
    floatingCameraY = 20
  } = settings;

  const [randomTitleFont, setRandomTitleFont] = useState(welcomeTitleFont);
  const [randomSubtitleFont, setRandomSubtitleFont] = useState(welcomeSubtitleFont);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with number for browser compatibility.
    let titleInterval: number | undefined;
    if (isWelcomeTitleFontRandom) {
      titleInterval = window.setInterval(() => {
        const randomIndex = Math.floor(Math.random() * GOOGLE_FONTS.length);
        setRandomTitleFont(GOOGLE_FONTS[randomIndex].value);
      }, 2000);
    }
    return () => clearInterval(titleInterval);
  }, [isWelcomeTitleFontRandom]);
  
  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with number for browser compatibility.
    let subtitleInterval: number | undefined;
    if (isWelcomeSubtitleFontRandom) {
      subtitleInterval = window.setInterval(() => {
        const randomIndex = Math.floor(Math.random() * GOOGLE_FONTS.length);
        setRandomSubtitleFont(GOOGLE_FONTS[randomIndex].value);
      }, 2000);
    }
    return () => clearInterval(subtitleInterval);
  }, [isWelcomeSubtitleFontRandom]);

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


  const backgroundContent = () => {
    const proxiedImageUrl = welcomeBgImageUrl?.startsWith('http') 
      ? `https://images.weserv.nl/?url=${encodeURIComponent(welcomeBgImageUrl)}` 
      : welcomeBgImageUrl;

    switch (welcomeBgType) {
      case 'color':
        return <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: welcomeBgColor }} />;
      case 'image':
        return <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${proxiedImageUrl}')` }} />;
      case 'camera':
        return <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />;
      case 'default':
      default:
        return <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }} />;
    }
  };
  
  const hasReviewsToShow = !isAdminLoggedIn && (settings.isReviewSliderEnabled ?? true) && reviews.length > 0;

  return (
    <div className="fixed inset-0 text-center flex flex-col items-center justify-center transition-colors duration-300 overflow-hidden">
      
      <div 
        className="absolute inset-0 w-full h-full transition-transform duration-300"
        style={{ transform: `scale(${welcomeBgZoom / 100})` }}
      >
        {backgroundContent()}
      </div>

      {(welcomeBgType === 'image' || welcomeBgType === 'camera') && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      {/* Floating 3D Camera Element */}
      {isFloatingCameraEnabled && (
        <div 
          className="absolute z-10 pointer-events-none animate-float-3d"
          style={{ 
            left: `${floatingCameraX}%`, 
            top: `${floatingCameraY}%`,
            transform: 'translate(-50%, -50%)' // Center on coordinate
          }}
        >
          {/* Replaced SVG with Three.js 3D Object */}
          <ThreeCamera className="w-60 h-60 md:w-80 md:h-80 drop-shadow-2xl" />
        </div>
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

        <div className={`flex-grow flex flex-col items-center justify-center transition-all duration-500 ${hasReviewsToShow ? 'pb-48' : ''}`}>
            <h1 
              className="text-8xl md:text-9xl tracking-widest text-white transition-all duration-500"
              style={{
                color: welcomeTitleColor || undefined,
                textShadow: isWelcomeTextShadowEnabled ? '2px 2px 8px rgba(0,0,0,0.7)' : 'none',
                fontFamily: isWelcomeTitleFontRandom ? randomTitleFont : welcomeTitleFont,
              }}
            >
              {welcomeTitle}
            </h1>
            <p 
              className="text-gray-200 mb-8 transition-all duration-500"
              style={{
                color: welcomeSubtitleColor || undefined,
                textShadow: isWelcomeTextShadowEnabled ? '1px 1px 4px rgba(0,0,0,0.7)' : 'none',
                fontFamily: isWelcomeSubtitleFontRandom ? randomSubtitleFont : welcomeSubtitleFont,
              }}
            >
              {welcomeSubtitle}
            </p>
            {isAdminLoggedIn ? (
                <div className="flex flex-wrap justify-center gap-4">
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
                  <button
                      onClick={onViewOnlineHistory}
                      className="bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg shadow-black/50 flex items-center gap-2"
                  >
                      <GlobeIcon />
                      Online History
                  </button>
                </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {settings.isOnlineHistoryEnabled && (
                    <button
                        onClick={onViewOnlineHistory}
                        className={`
                            font-bold py-3 px-10 rounded-full text-xl transition-all transform hover:scale-105 flex items-center gap-2
                            ${isOnlineHistoryButtonShadowEnabled ? 'shadow-lg shadow-black/50' : ''}
                            ${isOnlineHistoryButtonStrokeEnabled ? 'border-2' : 'border-0'}
                            ${!isOnlineHistoryButtonFillEnabled && !onlineHistoryButtonFillColor ? 'hover:bg-[var(--color-bg-secondary)]/50' : ''}
                            ${isOnlineHistoryButtonFillEnabled && !onlineHistoryButtonFillColor ? 'bg-[var(--color-bg-secondary)] hover:brightness-110' : ''}
                        `}
                        style={{
                            backgroundColor: isOnlineHistoryButtonFillEnabled ? (onlineHistoryButtonFillColor || undefined) : 'transparent',
                            color: onlineHistoryButtonTextColor || undefined,
                            borderColor: isOnlineHistoryButtonStrokeEnabled ? (onlineHistoryButtonStrokeColor || 'var(--color-text-secondary)') : 'transparent',
                        }}
                    >
                        {isOnlineHistoryButtonIconEnabled && <GlobeIcon />}
                        <span>{onlineHistoryButtonText}</span>
                    </button>
                )}
                <button
                  onClick={onStart}
                  disabled={isLoading || isCaching}
                  className={`
                      ${startButtonBgColor ? '' : 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)]'}
                      ${startButtonTextColor ? '' : 'text-[var(--color-accent-primary-text)]'}
                      ${isStartButtonShadowEnabled ? 'shadow-lg shadow-black/50' : ''}
                      font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105
                      disabled:bg-[var(--color-bg-tertiary)] disabled:transform-none disabled:cursor-wait
                  `}
                  style={{
                      backgroundColor: startButtonBgColor || undefined,
                      color: startButtonTextColor || undefined,
                  }}
                >
                  {isLoading ? 'Starting...' : startButtonText}
                </button>
              </div>
            )}
        </div>
      </div>
      
      {hasReviewsToShow && (
          <ReviewSlider reviews={reviews} maxDescriptionLength={settings.reviewSliderMaxDescriptionLength ?? 150} />
      )}
      
      {isCaching && <CachingStatus progress={cachingProgress} />}
    </div>
  );
};

export default WelcomeScreen;
