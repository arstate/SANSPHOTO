
import React, { useState, useCallback } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import CaptureScreen from './components/CaptureScreen';
import PreviewScreen from './components/PreviewScreen';
import { AppState, PhotoSlot, Settings, Template } from './types';

// Ini adalah data template placeholder. 
// Nantinya, ini bisa dimuat dari database atau file konfigurasi.
const INITIAL_PHOTO_SLOTS: PhotoSlot[] = [
  { id: 1, inputId: 1, x: 50,  y: 50,   width: 400, height: 400 },
  { id: 2, inputId: 2, x: 470, y: 50,   width: 400, height: 400 },
  { id: 3, inputId: 3, x: 50,  y: 470,  width: 400, height: 400 },
  { id: 4, inputId: 4, x: 470, y: 470,  width: 400, height: 400 },
];

const DEFAULT_TEMPLATE: Template = {
  id: 'template1',
  name: 'Simple 4-up',
  // Gambar placeholder untuk overlay template
  imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  widthMM: 100,
  heightMM: 150,
  orientation: 'portrait',
  photoSlots: INITIAL_PHOTO_SLOTS,
};

const DEFAULT_SETTINGS: Settings = {
  countdownDuration: 3,
  flashEffectEnabled: true,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const selectedTemplate = DEFAULT_TEMPLATE; // Untuk saat ini, kita hanya menggunakan satu template
  const settings = DEFAULT_SETTINGS; // Gunakan pengaturan default

  const handleStartSession = useCallback(() => {
    setCapturedImages([]);
    setAppState(AppState.CAPTURE);
  }, []);

  const handleCaptureComplete = useCallback((images: string[]) => {
    setCapturedImages(images);
    setAppState(AppState.PREVIEW);
  }, []);

  const handleSessionEnd = useCallback(() => {
    setCapturedImages([]);
    setAppState(AppState.WELCOME);
  }, []);


  const renderContent = () => {
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen onStart={handleStartSession} />;
      
      case AppState.CAPTURE:
        if (!selectedTemplate) return null;
        return <CaptureScreen 
            onComplete={handleCaptureComplete} 
            template={selectedTemplate} 
            countdownDuration={settings.countdownDuration} 
            flashEffectEnabled={settings.flashEffectEnabled}
        />;
      
      case AppState.PREVIEW:
        if (!selectedTemplate) return null;
        return <PreviewScreen 
            images={capturedImages} 
            onRestart={handleSessionEnd} 
            template={selectedTemplate} 
        />;
      
      default:
        return <WelcomeScreen onStart={handleStartSession} />;
    }
  };

  return (
    <div className="h-full bg-[var(--color-bg-primary)] flex flex-col items-center justify-center text-[var(--color-text-primary)] relative">
      <main className="w-full h-full p-4 flex flex-col items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
