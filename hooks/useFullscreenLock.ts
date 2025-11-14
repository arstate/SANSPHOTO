import { useEffect, useCallback } from 'react';

const useFullscreenLock = (isEnabled: boolean) => {
  const reEnterFullscreen = useCallback(async () => {
    // Hanya coba masuk kembali jika mode aktif dan kita tidak sedang dalam mode layar penuh
    if (isEnabled && !document.fullscreenElement) {
      const appContainer = document.getElementById('app-container');
      if (!appContainer) return;
      try {
        await appContainer.requestFullscreen({ navigationUI: 'hide' });
      } catch (err) {
        console.error("Tidak dapat masuk kembali ke mode layar penuh:", err);
      }
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleFullscreenChange = () => {
      // Penundaan kecil membantu mencegah kondisi balapan dan loop tak terbatas pada beberapa browser
      setTimeout(reEnterFullscreen, 100);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Blokir F11, Escape, dan pintasan umum untuk tab/jendela
      if (
        e.key === 'F11' ||
        e.key === 'Escape' ||
        (e.ctrlKey && (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'r' || e.key === 'Tab')) ||
        (e.metaKey && (e.key === 't' || e.key === 'w' || e.key === 'n' || e.key === 'r')) || // Cmd pada Mac
        e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
      }
    };
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        // Spesifikasi modern memerlukan returnValue untuk diatur.
        e.returnValue = '';
        return '';
    };

    // Coba masuk kembali saat jendela kehilangan fokus (misalnya, Alt+Tab)
    window.addEventListener('blur', reEnterFullscreen);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', reEnterFullscreen);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEnabled, reEnterFullscreen]);
};

export default useFullscreenLock;
