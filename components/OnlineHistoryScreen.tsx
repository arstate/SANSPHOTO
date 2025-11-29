
import React, { useState, useEffect } from 'react';
import { OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadingIcon } from './icons/UploadingIcon';
import { CloseIcon } from './icons/CloseIcon';
import { GOOGLE_SCRIPT_URL } from '../config';

interface OnlineHistoryScreenProps {
  onBack: () => void;
}

const SCRIPT_URL = GOOGLE_SCRIPT_URL;

const PhotoPreviewModal: React.FC<{
  photo: OnlineHistoryEntry;
  onClose: () => void;
  onDownload: (entry: OnlineHistoryEntry) => void;
  isDownloading: boolean;
}> = ({ photo, onClose, onDownload, isDownloading }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full h-full max-w-screen-lg max-h-screen-lg flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-10"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="flex-grow flex items-center justify-center min-h-0">
            <img 
                src={photo.url} 
                alt={photo.nama} 
                className="max-w-full max-h-full object-contain rounded-md"
            />
        </div>

        <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--color-border-primary)] text-center">
            <button
                onClick={() => onDownload(photo)}
                disabled={isDownloading}
                className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait mx-auto"
                aria-label="Download Photo"
            >
                {isDownloading ? <UploadingIcon /> : <DownloadIcon />}
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};


const OnlineHistoryScreen: React.FC<OnlineHistoryScreenProps> = ({ onBack }) => {
  const [photos, setPhotos] = useState<OnlineHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<OnlineHistoryEntry | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
          throw new Error(`Gagal mengambil data: ${response.statusText}`);
        }
        const data: OnlineHistoryEntry[] = await response.json();
        // Urutkan berdasarkan waktu, terbaru lebih dulu
        const sortedData = data.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
        setPhotos(sortedData);
      } catch (err) {
        console.error("Error fetching online history:", err);
        setError("Tidak dapat memuat histori online. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);
  
  const handleDownload = async (entry: OnlineHistoryEntry) => {
    if (downloading) return;
    setDownloading(entry.nama);
    try {
      // Gunakan proksi untuk melewati masalah CORS dengan URL gambar Google Drive
      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(entry.url)}`;
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil gambar melalui proksi: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = entry.nama || `sans-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert(`Gagal mengunduh ${entry.nama}. Silakan periksa koneksi Anda dan coba lagi.`);
    } finally {
      setDownloading(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-text-accent)] mb-4"></div>
          <p>Memuat galeri...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
          <p className="font-bold">Oops! Terjadi kesalahan.</p>
          <p>{error}</p>
        </div>
      );
    }

    if (photos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Belum Ada Foto</h3>
          <p>Histori online masih kosong. Cek kembali nanti!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {photos.map(entry => (
          <div 
            key={entry.nama} 
            className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden aspect-w-2 aspect-h-3 cursor-pointer"
            onClick={() => setSelectedPhoto(entry)}
          >
            <img src={entry.url} alt={entry.nama} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            <div className="absolute bottom-2 right-2">
               <button
                    onClick={(e) => {
                        e.stopPropagation(); // Mencegah modal terbuka
                        handleDownload(entry);
                    }}
                    disabled={!!downloading}
                    className="bg-black/40 hover:bg-black/60 text-white font-bold p-3 rounded-full transition-all transform hover:scale-110 disabled:scale-100 disabled:cursor-wait disabled:bg-black/60"
                    aria-label="Download Photo"
                >
                    {downloading === entry.nama ? <UploadingIcon /> : <DownloadIcon />}
                </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {selectedPhoto && (
        <PhotoPreviewModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDownload={handleDownload}
          isDownloading={downloading === selectedPhoto.nama}
        />
      )}
      <div className="relative flex flex-col w-full h-full bg-[var(--color-bg-primary)]">
        <header className="sticky top-0 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm z-10 p-4 flex items-center justify-center">
          <div className="absolute top-4 left-4">
            <button
              onClick={onBack}
              className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
              aria-label="Go Back"
            >
              <BackIcon />
            </button>
          </div>
          <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Online History</h2>
        </header>
        
        <main className="flex-grow overflow-y-auto scrollbar-thin p-4">
          {renderContent()}
        </main>
      </div>
    </>
  );
};

export default OnlineHistoryScreen;
