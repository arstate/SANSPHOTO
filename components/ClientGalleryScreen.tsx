
import React, { useState, useEffect } from 'react';
import { OnlineHistoryEntry } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadingIcon } from './icons/UploadingIcon';
import { CloseIcon } from './icons/CloseIcon';
import { db, ref, get } from '../firebase';
import { GOOGLE_SCRIPT_URL } from '../config';

interface ClientGalleryScreenProps {
  clientName: string;
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
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full h-full max-w-screen-lg max-h-screen-lg flex flex-col p-4 border border-[var(--color-border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-10"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="flex-grow flex items-center justify-center min-h-0 bg-black/20 rounded-md">
            <img 
                src={photo.url} 
                alt={photo.nama} 
                className="max-w-full max-h-full object-contain"
            />
        </div>

        <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--color-border-primary)] text-center">
            <button
                onClick={() => onDownload(photo)}
                disabled={isDownloading}
                className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait mx-auto shadow-lg"
                aria-label="Download Photo"
            >
                {isDownloading ? <UploadingIcon /> : <DownloadIcon />}
                <span>{isDownloading ? 'Downloading...' : 'Download High Quality'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

const ClientGalleryScreen: React.FC<ClientGalleryScreenProps> = ({ clientName }) => {
  const [photos, setPhotos] = useState<OnlineHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<OnlineHistoryEntry | null>(null);
  const [isAccessAllowed, setIsAccessAllowed] = useState(false);

  // Format clean name for display (replace _ or - with space)
  const displayName = clientName.replace(/[-_]/g, ' ').toUpperCase();

  // Helper to generate normalized slug from DB username for comparison
  const generateSlug = (userName: string) => {
      return userName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
  };

  useEffect(() => {
    const verifyAndFetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // --- STEP 1: VERIFY ACCESS VIA FIREBASE ---
        let isAuthorized = false;
        
        try {
            // 1. Prepare list of Tenant IDs to check. ALWAYS include 'master'.
            const tenantIdsToCheck = ['master'];

            // 2. Fetch other tenants from DB
            const tenantsSnapshot = await get(ref(db, 'tenants'));
            if (tenantsSnapshot.exists()) {
                const tenantsData = tenantsSnapshot.val();
                Object.keys(tenantsData).forEach(key => {
                    tenantIdsToCheck.push(key);
                });
            }
            
            // 3. Loop through Master AND all Tenants to find the payment
            for (const tenantId of tenantIdsToCheck) {
                if (isAuthorized) break; // Exit loop if found

                const paymentsSnapshot = await get(ref(db, `data/${tenantId}/payments`));
                if (paymentsSnapshot.exists()) {
                    const payments = Object.values(paymentsSnapshot.val()) as any[];
                    
                    // Check if any payment's generated slug matches the clientName in URL
                    const match = payments.find(p => {
                        const slug = generateSlug(p.userName || '');
                        // Compare slugs case-insensitively
                        return slug.toLowerCase() === clientName.toLowerCase();
                    });

                    if (match) {
                        isAuthorized = true;
                    }
                }
            }
        } catch (fbError) {
            console.error("Firebase verification failed:", fbError);
            throw new Error("Gagal memverifikasi akses galeri.");
        }

        if (!isAuthorized) {
            setIsAccessAllowed(false);
            setIsLoading(false);
            return; // Stop here, do not fetch photos
        }

        setIsAccessAllowed(true);

        // --- STEP 2: FETCH PHOTOS IF AUTHORIZED ---
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch gallery.`);
        }
        const data: OnlineHistoryEntry[] = await response.json();
        
        // Filter photos that contain the client name (case insensitive)
        const cleanSearchTerm = clientName.replace(/[-_]/g, ' ').toLowerCase().trim();
        
        const filteredData = data.filter(item => {
            const fileName = item.nama.toLowerCase().replace(/[-_]/g, ' ');
            return fileName.includes(cleanSearchTerm);
        });

        // Sort by newest
        const sortedData = filteredData.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
        setPhotos(sortedData);

      } catch (err: any) {
        console.error("Error fetching client history:", err);
        setError(err.message || "Tidak dapat memuat galeri foto. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFetch();
  }, [clientName]);
  
  const handleDownload = async (entry: OnlineHistoryEntry) => {
    if (downloading) return;
    setDownloading(entry.nama);
    try {
      // Use proxy to avoid CORS issues
      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(entry.url)}`;
      const response = await fetch(proxiedUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = entry.nama || `sans-photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert(`Gagal mengunduh foto. Silakan coba lagi.`);
    } finally {
      setDownloading(null);
    }
  };

  // Rendering for Unauthorized Access
  if (!isLoading && !isAccessAllowed && !error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-[var(--color-bg-primary)]">
            <div className="bg-[var(--color-bg-secondary)] p-8 rounded-2xl shadow-xl border border-red-500/30 max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Akses Galeri Kadaluarsa</h2>
                <p className="text-[var(--color-text-secondary)]">
                    Maaf, galeri foto untuk <strong>{displayName}</strong> tidak ditemukan atau telah dihapus oleh admin.
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-4">Silakan hubungi admin jika ini adalah kesalahan.</p>
            </div>
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
      <div className="relative flex flex-col w-full h-full bg-[var(--color-bg-primary)] overflow-hidden">
        <header className="shrink-0 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)] shadow-md z-10 p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl text-[var(--color-text-accent)] font-bold tracking-wider mb-1">GALERI FOTO</h2>
          <h1 className="text-4xl md:text-5xl font-bebas text-[var(--color-text-primary)] text-center">{displayName}</h1>
        </header>
        
        <main className="flex-grow overflow-y-auto scrollbar-thin p-4 md:p-8 w-full max-w-7xl mx-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)] mb-4"></div>
                    <p>Memverifikasi akses & memuat foto...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
                    <p className="font-bold text-xl mb-2">Oops!</p>
                    <p>{error}</p>
                </div>
            ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Belum Ada Foto</h3>
                    <p className="max-w-md mx-auto">Kami tidak menemukan foto dengan nama <strong>{displayName}</strong>. Pastikan penulisan nama saat sesi foto sudah benar atau foto sedang dalam proses upload.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {photos.map(entry => (
                    <div 
                        key={entry.nama} 
                        className="group relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:border-[var(--color-accent-primary)] cursor-pointer"
                        onClick={() => setSelectedPhoto(entry)}
                    >
                        <div className="aspect-[2/3] w-full bg-black/10">
                            <img src={entry.url} alt={entry.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(entry);
                                }}
                                disabled={!!downloading}
                                className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-wait"
                            >
                                {downloading === entry.nama ? <UploadingIcon /> : <DownloadIcon />}
                                <span className="text-sm">Download</span>
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </main>
        
        <footer className="shrink-0 p-4 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)]">
            &copy; {new Date().getFullYear()} Sans Photobooth
        </footer>
      </div>
    </>
  );
};

export default ClientGalleryScreen;
