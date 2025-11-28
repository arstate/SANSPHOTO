
import React, { useState, useEffect } from 'react';
import { Settings, FloatingObject, PriceList, PaymentEntry, OnlineHistoryEntry } from '../types';
import { BackIcon } from './icons/BackIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TicketIcon } from './icons/TicketIcon';
import { InfoIcon } from './icons/InfoIcon';
import KioskGuide from './KioskGuide';
import { SettingsIcon } from './icons/SettingsIcon';
import { EyeIcon } from './icons/EyeIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ReviewsIcon } from './icons/ReviewsIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CameraIcon } from './icons/CameraIcon';
import { RestartIcon } from './icons/RestartIcon';
import { ToggleOnIcon } from './icons/ToggleOnIcon';
import { ToggleOffIcon } from './icons/ToggleOffIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AddIcon } from './icons/AddIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { UploadingIcon } from './icons/UploadingIcon';
import { DollarIcon } from './icons/DollarIcon';
import { PrintIcon } from './icons/PrintIcon';
import { CheckIcon } from './icons/CheckIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface SettingsScreenProps {
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
    onManageTemplates: () => void;
    onManageEvents: () => void;
    onManageSessions: () => void;
    onManageReviews: () => void;
    onViewHistory: () => void;
    onBack: () => void;
    isMasterAdmin: boolean;
    onManageTenants: () => void;
    payments?: PaymentEntry[];
    onDeletePayment: (id: string) => void;
}

export const GOOGLE_FONTS = [
  { name: 'Bebas Neue (Default)', value: "'Bebas Neue', sans-serif" },
  { name: 'Poppins (Default)', value: "'Poppins', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Lora', value: "'Lora', serif" },
  { name: 'Oswald', value: "'Oswald', sans-serif" },
  { name: 'Lobster', value: "'Lobster', cursive" },
  { name: 'Pacifico', value: "'Pacifico', cursive" },
  { name: 'Caveat', value: "'Caveat', cursive" },
  { name: 'Roboto Mono', value: "'Roboto Mono', monospace" },
];

type SettingsCategory = 'general' | 'appearance' | 'security' | 'content' | 'payment' | 'reviews' | 'master';

// URL to fetch list of photos (Same as OnlineHistoryScreen)
const SCRIPT_URL_GET_HISTORY = 'https://script.google.com/macros/s/AKfycbwbnlO9vk95yTKeHFFilhJbfFcjibH80sFzsA5II3BAkuNudCTabRNdBUhYlCEHHO5CYQ/exec';

const CategoryButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 text-left p-3 rounded-lg transition-colors text-lg ${
      isActive
        ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)] font-bold'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);


const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    settings, onSettingsChange, onManageTemplates, onManageEvents, onManageSessions, onManageReviews, onViewHistory, onBack,
    isMasterAdmin, onManageTenants, payments = [], onDeletePayment
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [showPrintConfigSuccess, setShowPrintConfigSuccess] = useState(false);
  
  // Payment State
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceDesc, setNewPriceDesc] = useState('');
  const [newPriceAmount, setNewPriceAmount] = useState('');
  const [newPriceTakes, setNewPriceTakes] = useState(1);

  // View Payment Photo Gallery State
  const [viewingPhotos, setViewingPhotos] = useState<OnlineHistoryEntry[] | null>(null);
  const [isFindingPhoto, setIsFindingPhoto] = useState<string | null>(null); // Stores ID of payment being searched
  const [downloadingPhotoIds, setDownloadingPhotoIds] = useState<string[]>([]);

  const isLight = settings.theme === 'light';

  // Load devices for camera selection
  useEffect(() => {
      if (activeCategory === 'general') {
          refreshVideoDevices();
      }
  }, [activeCategory]);

  const refreshVideoDevices = async () => {
      try {
          // Request permission first to get labels
          await navigator.mediaDevices.getUserMedia({ video: true });
          
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(device => device.kind === 'videoinput');
          setVideoDevices(videoInputs);
      } catch (err) {
          console.error("Error enumerating devices:", err);
      }
  };

  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: string | number | boolean = value;
    
    if (type === 'checkbox' && 'checked' in e.target) {
        finalValue = e.target.checked;
    } else if (type === 'number' || type === 'range') {
        finalValue = parseInt(value, 10) || 0;
    } else if (type === 'datetime-local') {
        finalValue = new Date(value).getTime();
    }

    onSettingsChange({
      ...settings,
      [name]: finalValue,
    });
  };
  
  // Specialized handlers for mutual exclusivity
  const handleToggleSessionCode = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isEnabled = e.target.checked;
      onSettingsChange({
          ...settings,
          isSessionCodeEnabled: isEnabled,
          // If Session Code turned ON, Payment must be OFF
          isPaymentEnabled: isEnabled ? false : settings.isPaymentEnabled
      });
  };

  const handleTogglePaymentMode = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isEnabled = e.target.checked;
      onSettingsChange({
          ...settings,
          isPaymentEnabled: isEnabled,
          // If Payment turned ON, Session Code must be OFF
          isSessionCodeEnabled: isEnabled ? false : settings.isSessionCodeEnabled
      });
  };
  
  const handleThemeChange = (theme: 'light' | 'dark') => {
    onSettingsChange({ ...settings, theme });
  };
  
  const handleResetSetting = (name: keyof Settings) => {
    onSettingsChange({ ...settings, [name]: '' });
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
  
  const handleToggleClosedMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    let newTimestamp = settings.reopenTimestamp;
    // Jika mengaktifkan dan timestamp tidak ada atau sudah lewat, set default 1 jam dari sekarang
    if (isEnabled && (!newTimestamp || newTimestamp < Date.now())) {
      newTimestamp = Date.now() + 3600 * 1000; // 1 jam dari sekarang
    }
    onSettingsChange({
      ...settings,
      isClosedModeEnabled: isEnabled,
      reopenTimestamp: newTimestamp,
    });
  };
  
  // Floating Object Management
  const handleObjectToggle = (id: string) => {
      const updatedObjects = (settings.floatingObjects || []).map(obj => 
        obj.id === id ? { ...obj, isVisible: !obj.isVisible } : obj
      );
      onSettingsChange({ ...settings, floatingObjects: updatedObjects });
  };
  
  const handleDeleteObject = (id: string) => {
      if (!window.confirm("Delete this object?")) return;
      const updatedObjects = (settings.floatingObjects || []).filter(obj => obj.id !== id);
      onSettingsChange({ ...settings, floatingObjects: updatedObjects });
  };
  
  const handleObjectPropertyChange = (id: string, prop: keyof FloatingObject, value: any) => {
      const updatedObjects = (settings.floatingObjects || []).map(obj => 
        obj.id === id ? { ...obj, [prop]: value } : obj
      );
      onSettingsChange({ ...settings, floatingObjects: updatedObjects });
  };

  const handleAddVoxelObject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        // Basic validation: check if it's JSON and has array structure
        const json = JSON.parse(text);
        if (!Array.isArray(json)) {
            alert("Invalid Voxel JSON format. Expected an array of voxel points.");
            return;
        }
        
        const newObject: FloatingObject = {
            id: `voxel-${Date.now()}`,
            type: 'custom-voxel',
            name: file.name.replace('.json', ''),
            isVisible: true,
            voxelData: text,
            positionX: 50,
            positionY: 50,
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            isSpinning: true,
            spinSpeed: 0.005
        };
        
        onSettingsChange({ ...settings, floatingObjects: [...(settings.floatingObjects || []), newObject] });
        e.target.value = ''; // Reset input
    } catch (err) {
        console.error("Error parsing voxel file", err);
        alert("Failed to read JSON file.");
    }
  };
  
  // Payment Management
  const handleAddPriceList = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPriceName || !newPriceAmount) return;
      
      const newItem: PriceList = {
          id: `price-${Date.now()}`,
          name: newPriceName,
          description: newPriceDesc,
          price: parseInt(newPriceAmount, 10),
          maxTakes: newPriceTakes
      };
      
      onSettingsChange({
          ...settings,
          priceLists: [...(settings.priceLists || []), newItem]
      });
      
      setNewPriceName('');
      setNewPriceDesc('');
      setNewPriceAmount('');
      setNewPriceTakes(1);
  };

  const handleDeletePriceList = (id: string) => {
      if (confirm('Delete this price package?')) {
          onSettingsChange({
              ...settings,
              priceLists: (settings.priceLists || []).filter(p => p.id !== id)
          });
      }
  };

  // Logic to fetch photos for admin usage (send to WA)
  const fetchPhotosForPayment = async (payment: PaymentEntry): Promise<OnlineHistoryEntry[]> => {
      const safeUserName = payment.userName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
      if (!safeUserName) return [];

      const response = await fetch(SCRIPT_URL_GET_HISTORY);
      if (!response.ok) throw new Error("Failed to fetch photo list");
      
      const data: OnlineHistoryEntry[] = await response.json();
      const matchedPhotos = data.filter(item => item.nama.includes(safeUserName));
      return matchedPhotos.sort((a, b) => b.nama.localeCompare(a.nama));
  };

  // Payment Photo Viewing Logic (Gallery Support)
  const handleViewPaymentPhoto = async (payment: PaymentEntry) => {
      if (isFindingPhoto) return;
      setIsFindingPhoto(payment.id);

      try {
          const matchedPhotos = await fetchPhotosForPayment(payment);

          if (matchedPhotos.length > 0) {
              setViewingPhotos(matchedPhotos);
          } else {
              alert(`Photos for user "${payment.userName}" not found in cloud storage. They might not be uploaded yet.`);
          }

      } catch (e) {
          console.error("Error finding photo:", e);
          alert("Failed to retrieve photos from cloud.");
      } finally {
          setIsFindingPhoto(null);
      }
  };

  const handleDownloadPhoto = async (photo: OnlineHistoryEntry) => {
      if (downloadingPhotoIds.includes(photo.nama)) return;
      setDownloadingPhotoIds(prev => [...prev, photo.nama]);

      try {
          // Use Proxy to bypass CORS
          const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(photo.url)}`;
          const response = await fetch(proxiedUrl);
          if (!response.ok) throw new Error("Proxy fetch failed");
          
          const blob = await response.blob();
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = photo.nama || `payment-photo-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      } catch (e) {
          console.error("Download error:", e);
          alert("Failed to download image.");
      } finally {
          setDownloadingPhotoIds(prev => prev.filter(id => id !== photo.nama));
      }
  };

  const handleSendWhatsApp = async (payment: PaymentEntry) => {
      if (!payment.whatsappNumber) return;
      
      // 1. Sanitize number (Replace 08... with 628...)
      let phone = payment.whatsappNumber.replace(/\D/g, ''); // Remove non-numeric
      if (phone.startsWith('0')) {
          phone = '62' + phone.slice(1);
      }

      // 2. Prepare Message
      const message = `Halo Kak ${payment.userName}, 
      
Terima kasih telah menggunakan jasa Sans Photobooth! 
Berikut adalah softfile foto kakak. 

Semoga suka ya! Jangan lupa tag kami di sosial media! 📸✨`;

      const encodedMessage = encodeURIComponent(message);
      
      // 3. Auto-download photo so admin can drag-drop
      // We'll try to fetch the most recent photo
      try {
          const photos = await fetchPhotosForPayment(payment);
          if (photos.length > 0) {
              const recentPhoto = photos[0];
              // Trigger download
              await handleDownloadPhoto(recentPhoto);
          } else {
              alert("Foto belum tersedia di server. Chat akan dibuka tanpa foto otomatis.");
          }
      } catch (e) {
          console.error("Failed to auto-download for WA", e);
      }

      // 4. Open WhatsApp
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleConfigurePrinter = () => {
    // Standard visible iframe for browser popup print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.zIndex = '9999';
    iframe.style.backgroundColor = 'white';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Printer Calibration</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; text-align: center; color: #333; }
                    .instruction { margin: 20px auto; border: 2px dashed #ccc; padding: 20px; max-width: 600px; text-align: left; }
                    .btn { padding: 10px 20px; background: #eee; border: 1px solid #ccc; cursor: pointer; display: none; }
                </style>
            </head>
            <body>
                <h1>Printer Configuration Page</h1>
                <p>This is a test page to configure your browser's default print settings.</p>
                
                <div class="instruction">
                    <h3>Instructions:</h3>
                    <ol>
                        <li>In the print dialog, select your Target Printer.</li>
                        <li>Set <strong>Margins</strong> to <strong>None</strong>.</li>
                        <li>Set <strong>Scale</strong> to <strong>100%</strong> (or Default).</li>
                        <li>Ensure <strong>Background Graphics</strong> is checked if needed.</li>
                        <li>Click <strong>Print</strong> to save these settings as the browser default.</li>
                    </ol>
                    <p><em>Note: You can select "Save as PDF" if you don't want to waste paper, as long as the page size matches.</em></p>
                </div>
            </body>
            </html>
        `);
        doc.close();

        // Listen for the print dialog closing (approximate save)
        const onAfterPrint = () => {
            document.body.removeChild(iframe);
            setShowPrintConfigSuccess(true);
            setTimeout(() => setShowPrintConfigSuccess(false), 3000);
        };

        iframe.contentWindow!.onafterprint = onAfterPrint;
        
        iframe.contentWindow!.focus();
        setTimeout(() => {
            iframe.contentWindow!.print();
        }, 500);
    }
  };

  
  // Konversi timestamp ke format yang diterima oleh input datetime-local
  const formatTimestampForInput = (timestamp: number | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  const renderContent = () => {
    switch(activeCategory) {
      case 'general':
        return (
          <div className="space-y-6">
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
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="maxRetakes" className="block text-sm font-medium text-[var(--color-text-secondary)]">Max Retakes per Session</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Number of times a user can retake individual photos. Set to 0 to disable.</p>
                    <input
                        type="number"
                        id="maxRetakes"
                        name="maxRetakes"
                        value={settings.maxRetakes ?? 0}
                        onChange={handleSettingsInputChange}
                        min="0"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                </div>
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isAutoFullscreenEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Auto Fullscreen on Start</span>
                          <p className="text-xs text-[var(--color-text-muted)]">Automatically enters fullscreen mode on the first click/touch.</p>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="isAutoFullscreenEnabled"
                              name="isAutoFullscreenEnabled"
                              checked={settings.isAutoFullscreenEnabled ?? false}
                              onChange={handleSettingsInputChange}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
            </div>

            {/* Camera Source Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)] flex items-center gap-2"><CameraIcon /> Camera Source</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Choose between the default device webcam or an external IP Camera stream.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${settings.cameraSourceType !== 'ip_camera' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'}`}>
                        <input 
                            type="radio" 
                            name="cameraSourceType" 
                            value="default" 
                            checked={settings.cameraSourceType !== 'ip_camera'} 
                            onChange={handleSettingsInputChange} 
                            className="sr-only"
                        />
                        <span className="font-bold">Default Webcam</span>
                        <span className="text-xs text-center text-[var(--color-text-muted)] mt-1">Uses browser API (USB/HDMI Capture)</span>
                    </label>

                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${settings.cameraSourceType === 'ip_camera' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'}`}>
                        <input 
                            type="radio" 
                            name="cameraSourceType" 
                            value="ip_camera" 
                            checked={settings.cameraSourceType === 'ip_camera'} 
                            onChange={handleSettingsInputChange} 
                            className="sr-only"
                        />
                        <span className="font-bold">IP Camera / Web Server</span>
                        <span className="text-xs text-center text-[var(--color-text-muted)] mt-1">MJPEG Stream via HTTP/URL</span>
                    </label>
                </div>
                
                {/* USB/Default Device Selection */}
                {settings.cameraSourceType !== 'ip_camera' && (
                    <div className="mt-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="cameraDeviceId" className="block text-sm font-medium text-[var(--color-text-secondary)]">Select Input Device</label>
                            <button 
                                onClick={refreshVideoDevices} 
                                className="text-xs text-[var(--color-text-accent)] flex items-center gap-1 hover:underline"
                            >
                                <RestartIcon /> Refresh Devices
                            </button>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">If using USB HDMI capture on mobile, select the USB device here.</p>
                        <select
                            id="cameraDeviceId"
                            name="cameraDeviceId"
                            value={settings.cameraDeviceId || ''}
                            onChange={handleSettingsInputChange}
                            className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                        >
                            <option value="">Default (Front Camera / Auto)</option>
                            {videoDevices.map((device, index) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${index + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {settings.cameraSourceType === 'ip_camera' && (
                    <div className="mt-4 animate-fade-in space-y-4">
                        <div>
                            <label htmlFor="ipCameraUrl" className="block text-sm font-medium text-[var(--color-text-secondary)]">HTTP Stream URL</label>
                            <p className="text-xs text-[var(--color-text-muted)] mb-2">e.g., http://192.168.1.24:8081 or http://192.168.1.24:8081/video</p>
                            <input
                                type="url"
                                id="ipCameraUrl"
                                name="ipCameraUrl"
                                value={settings.ipCameraUrl || ''}
                                onChange={handleSettingsInputChange}
                                placeholder="http://192.168.1..."
                                className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm font-mono"
                            />
                        </div>

                        <label htmlFor="ipCameraUseProxy" className="flex items-center justify-between cursor-pointer p-2 bg-[var(--color-bg-tertiary)]/50 rounded border border-[var(--color-border-secondary)]">
                            <div>
                                <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable CORS Proxy</span>
                                <p className="text-xs text-[var(--color-text-muted)]">Wraps the URL in a public proxy to bypass CORS/Mixed-Content issues.</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="ipCameraUseProxy"
                                    name="ipCameraUseProxy"
                                    checked={settings.ipCameraUseProxy || false}
                                    onChange={handleSettingsInputChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                            </div>
                        </label>

                        <p className="text-xs text-yellow-500 mt-2">
                            Note: If the camera server is on a different network or doesn't support CORS, the preview might load but capturing to canvas (saving photo) might fail due to browser security policies (Tainted Canvas). Enable the Proxy option above if you encounter issues.
                        </p>
                    </div>
                )}
            </div>

            {/* Closed Mode Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Closed Mode</h3>
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isClosedModeEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Closed Mode</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Replaces the welcome screen with a countdown to reopening.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isClosedModeEnabled" name="isClosedModeEnabled" checked={settings.isClosedModeEnabled ?? false} onChange={handleToggleClosedMode} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
              {settings.isClosedModeEnabled && (
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="reopenTimestamp" className="block text-sm font-medium text-[var(--color-text-secondary)]">Reopen Date & Time</label>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Set when the photobooth will be available again for users.</p>
                  <input
                    type="datetime-local"
                    id="reopenTimestamp"
                    name="reopenTimestamp"
                    value={formatTimestampForInput(settings.reopenTimestamp)}
                    onChange={handleSettingsInputChange}
                    className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                  />
                </div>
              )}
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

            {/* Print Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Print Settings</h3>
              
              {/* Configure Defaults Button */}
              <div className="bg-[var(--color-bg-tertiary)]/50 p-4 rounded-lg border border-[var(--color-border-secondary)]">
                  <div className="flex justify-between items-start gap-4">
                      <div>
                          <h4 className="font-bold text-[var(--color-text-primary)]">Printer Calibration</h4>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              Open the browser's native print dialog to set margins, paper size, and scale as defaults for Kiosk mode.
                          </p>
                      </div>
                      <button 
                        onClick={handleConfigurePrinter}
                        className="bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-[var(--color-info-text)] font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap flex items-center gap-2"
                      >
                          <SettingsIcon /> Configure Defaults
                      </button>
                  </div>
                  <p className="text-[10px] text-yellow-500 mt-2">
                      *Note: If you launched Chrome with <code>--kiosk-printing</code>, the popup will be suppressed. Launch normally to configure.
                  </p>
              </div>

              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isPrintButtonEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Print Button</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Show a 'Print' button on the final preview screen.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isPrintButtonEnabled" name="isPrintButtonEnabled" checked={settings.isPrintButtonEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>

              {(settings.isPrintButtonEnabled ?? true) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                      <div>
                        <label htmlFor="printPaperSize" className="block text-sm font-medium text-[var(--color-text-secondary)]">Paper Size</label>
                        <select id="printPaperSize" name="printPaperSize" value={settings.printPaperSize ?? '4x6'} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                          <option value="4x6">4x6 inch</option>
                          <option value="A4_portrait">A4 Portrait</option>
                          <option value="A4_landscape">A4 Landscape</option>
                        </select>
                      </div>
                       <div>
                        <label htmlFor="printColorMode" className="block text-sm font-medium text-[var(--color-text-secondary)]">Color Mode</label>
                        <select id="printColorMode" name="printColorMode" value={settings.printColorMode ?? 'color'} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                          <option value="color">Color</option>
                          <option value="grayscale">Grayscale</option>
                        </select>
                      </div>
                  </div>
                   <div className="border-t border-[var(--color-border-primary)] pt-4">
                      <label htmlFor="isPrintCopyInputEnabled" className="flex items-center justify-between cursor-pointer">
                          <div>
                              <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show 'Number of Copies' Option</span>
                              <p className="text-xs text-[var(--color-text-muted)]">Allow users to choose how many copies to print.</p>
                          </div>
                          <div className="relative">
                              <input type="checkbox" id="isPrintCopyInputEnabled" name="isPrintCopyInputEnabled" checked={settings.isPrintCopyInputEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                              <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                          </div>
                      </label>
                  </div>
                  {(settings.isPrintCopyInputEnabled ?? true) && (
                     <div className="border-t border-[var(--color-border-primary)] pt-4">
                        <label htmlFor="printMaxCopies" className="block text-sm font-medium text-[var(--color-text-secondary)]">Maximum Copies per Print</label>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Set the maximum number of copies a user can select.</p>
                        <input type="number" id="printMaxCopies" name="printMaxCopies" value={settings.printMaxCopies ?? 5} onChange={handleSettingsInputChange} min="1" className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case 'appearance':
        const currentFloatingObjects = settings.floatingObjects || [];
        const editingObject = editingObjectId ? currentFloatingObjects.find(o => o.id === editingObjectId) : null;
        
        return (
           <div className="space-y-6">
             {/* Welcome Screen Text Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Text</h3>
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
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeTitleColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Title Color</label>
                        <button onClick={() => handleResetSetting('welcomeTitleColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                      </div>
                      <input type="color" id="welcomeTitleColor" name="welcomeTitleColor" value={settings.welcomeTitleColor || '#F9FAFB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                  </div>
                  <div>
                       <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeSubtitleColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle Color</label>
                        <button onClick={() => handleResetSetting('welcomeSubtitleColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                      </div>
                      <input type="color" id="welcomeSubtitleColor" name="welcomeSubtitleColor" value={settings.welcomeSubtitleColor || '#D1D5DB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                  </div>
              </div>

               <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeTitleFont" className="block text-sm font-medium text-[var(--color-text-secondary)]">Title Font</label>
                    <select id="welcomeTitleFont" name="welcomeTitleFont" value={settings.welcomeTitleFont} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                  <label htmlFor="isWelcomeTitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Randomize Title Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeTitleFontRandom" name="isWelcomeTitleFontRandom" checked={settings.isWelcomeTitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                  </label>
                </div>
                <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeSubtitleFont" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle Font</label>
                    <select id="welcomeSubtitleFont" name="welcomeSubtitleFont" value={settings.welcomeSubtitleFont} onChange={handleSettingsInputChange} className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                   <label htmlFor="isWelcomeSubtitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Randomize Subtitle Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeSubtitleFontRandom" name="isWelcomeSubtitleFontRandom" checked={settings.isWelcomeSubtitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                  </label>
                </div>

              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isWelcomeTextShadowEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Text Shadow</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Adds a drop shadow for better readability.</p>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="isWelcomeTextShadowEnabled"
                            name="isWelcomeTextShadowEnabled"
                            checked={settings.isWelcomeTextShadowEnabled ?? true}
                            onChange={handleSettingsInputChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
            </div>
            
            {/* Floating 3D Objects Manager */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Floating 3D Objects</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Manage decorative 3D objects on the welcome screen.</p>
              
              {/* List */}
              <div className="space-y-3">
                  {currentFloatingObjects.map(obj => (
                      <div key={obj.id} className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg border border-[var(--color-border-secondary)]">
                          <div className="flex justify-between items-center mb-2">
                              <div>
                                  <span className="font-bold text-[var(--color-text-primary)]">{obj.name}</span>
                                  <span className="ml-2 text-xs text-[var(--color-text-muted)] px-1.5 py-0.5 border border-[var(--color-text-muted)] rounded">
                                      {obj.type === 'built-in-camera' ? 'Built-in' : 'Custom Voxel'}
                                  </span>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleObjectToggle(obj.id)} className={`p-1.5 rounded-full ${obj.isVisible ? 'text-green-400 bg-green-900/20' : 'text-gray-400 bg-gray-700/50'}`}>
                                      {obj.isVisible ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                  </button>
                                  <button onClick={() => setEditingObjectId(editingObjectId === obj.id ? null : obj.id)} className={`p-1.5 rounded-full ${editingObjectId === obj.id ? 'text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'text-gray-400 hover:text-white'}`}>
                                      <EditIcon />
                                  </button>
                                  <button onClick={() => handleDeleteObject(obj.id)} className="p-1.5 rounded-full text-red-400 hover:bg-red-900/20">
                                      <TrashIcon />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Inline Edit Form */}
                          {editingObjectId === obj.id && (
                              <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                                  <div>
                                      <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Scale ({obj.scale})</label>
                                      <input 
                                        type="range" min="0.1" max="3" step="0.1" 
                                        value={obj.scale} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'scale', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Spin Speed ({obj.spinSpeed})</label>
                                      <input 
                                        type="range" min="0" max="0.1" step="0.001" 
                                        value={obj.spinSpeed} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'spinSpeed', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Pos X ({obj.positionX}%)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={obj.positionX} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'positionX', parseInt(e.target.value))}
                                        className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Pos Y ({obj.positionY}%)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={obj.positionY} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'positionY', parseInt(e.target.value))}
                                        className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer"
                                      />
                                  </div>
                                  
                                  <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-2">
                                      <div>
                                          <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Rot X</label>
                                          <input type="number" step="0.1" value={obj.rotationX} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationX', parseFloat(e.target.value))} className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-2 py-1 text-xs" />
                                      </div>
                                      <div>
                                          <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Rot Y</label>
                                          <input type="number" step="0.1" value={obj.rotationY} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationY', parseFloat(e.target.value))} className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-2 py-1 text-xs" />
                                      </div>
                                      <div>
                                          <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Rot Z</label>
                                          <input type="number" step="0.1" value={obj.rotationZ} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationZ', parseFloat(e.target.value))} className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-2 py-1 text-xs" />
                                      </div>
                                  </div>

                                  <div className="col-span-1 sm:col-span-2">
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={obj.isSpinning} onChange={(e) => handleObjectPropertyChange(obj.id, 'isSpinning', e.target.checked)} className="rounded bg-[var(--color-bg-primary)] border-[var(--color-border-secondary)]" />
                                        <span className="text-sm">Enable Spinning Animation</span>
                                     </label>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* Upload New */}
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Add Custom Voxel Object (.json)</label>
                 <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[var(--color-border-secondary)] rounded-lg cursor-pointer hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                     <div className="flex flex-col items-center">
                         <AddIcon />
                         <span className="text-xs mt-1 text-[var(--color-text-muted)]">Click to upload JSON</span>
                     </div>
                     <input type="file" accept=".json" onChange={handleAddVoxelObject} className="hidden" />
                 </label>
                 <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Format: JSON array of objects with x, y, z coordinates and color hex. Example: <code>[{`{"x":0,"y":0,"z":0,"color":"#ff0000"}`}]</code>
                 </p>
              </div>

            </div>

            {/* Welcome Screen Background Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Background</h3>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Type</label>
                <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-lg bg-[var(--color-bg-tertiary)] p-1">
                  {(['default', 'color', 'image', 'camera'] as const).map(type => (
                    <label key={type} className={`block text-center cursor-pointer rounded-md py-2 px-3 text-sm font-semibold transition-colors ${settings.welcomeBgType === type ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : 'hover:bg-[var(--color-bg-primary)]'}`}>
                      <input type="radio" name="welcomeBgType" value={type} checked={settings.welcomeBgType === type} onChange={handleSettingsInputChange} className="sr-only"/>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {settings.welcomeBgType === 'color' && (
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="welcomeBgColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Color</label>
                  <input type="color" id="welcomeBgColor" name="welcomeBgColor" value={settings.welcomeBgColor || '#111827'} onChange={handleSettingsInputChange} className="mt-1 w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                </div>
              )}

              {settings.welcomeBgType === 'image' && (
                <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeBgImageUrl" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Image URL</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Use a direct image link. For Google Photos, use an embed link.</p>
                    <input
                        type="url"
                        id="welcomeBgImageUrl"
                        name="welcomeBgImageUrl"
                        value={settings.welcomeBgImageUrl || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="https://..."
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                  </div>
                </div>
              )}
              
              {(settings.welcomeBgType === 'color' || settings.welcomeBgType === 'image' || settings.welcomeBgType === 'camera') && (
                 <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="welcomeBgZoom" className="block text-sm font-medium text-[var(--color-text-secondary)]">Zoom ({settings.welcomeBgZoom || 100}%)</label>
                  <input
                    id="welcomeBgZoom"
                    name="welcomeBgZoom"
                    type="range"
                    min="100"
                    max="300"
                    value={settings.welcomeBgZoom || 100}
                    onChange={handleSettingsInputChange}
                    className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            
             {/* Start Button Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Start Button</h3>
                <div>
                    <label htmlFor="startButtonText" className="block text-sm font-medium text-[var(--color-text-secondary)]">Button Text</label>
                    <input
                        type="text"
                        id="startButtonText"
                        name="startButtonText"
                        value={settings.startButtonText || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="e.g., START SESSION"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonBgColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Background Color</label>
                            <button onClick={() => handleResetSetting('startButtonBgColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                        </div>
                        <input type="color" id="startButtonBgColor" name="startButtonBgColor" value={settings.startButtonBgColor || '#8B5CF6'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonTextColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Text Color</label>
                            <button onClick={() => handleResetSetting('startButtonTextColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                        </div>
                        <input type="color" id="startButtonTextColor" name="startButtonTextColor" value={settings.startButtonTextColor || '#FFFFFF'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                    </div>
                </div>
                
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="isStartButtonShadowEnabled" className="flex items-center justify-between cursor-pointer">
                        <div>
                            <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Button Shadow</span>
                            <p className="text-xs text-[var(--color-text-muted)]">Adds a drop shadow to the start button.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="isStartButtonShadowEnabled"
                                name="isStartButtonShadowEnabled"
                                checked={settings.isStartButtonShadowEnabled ?? true}
                                onChange={handleSettingsInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Online History Button Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Online History Button (User)</h3>
                
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="isOnlineHistoryEnabled" className="flex items-center justify-between cursor-pointer">
                        <div>
                            <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show Online History Button</span>
                            <p className="text-xs text-[var(--color-text-muted)]">Toggles the button's visibility on the user's welcome screen.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="isOnlineHistoryEnabled"
                                name="isOnlineHistoryEnabled"
                                checked={settings.isOnlineHistoryEnabled ?? false}
                                onChange={handleSettingsInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                        </div>
                    </label>
                </div>
                
                <div>
                    <label htmlFor="onlineHistoryButtonText" className="block text-sm font-medium text-[var(--color-text-secondary)]">Button Text</label>
                    <input
                        type="text"
                        id="onlineHistoryButtonText"
                        name="onlineHistoryButtonText"
                        value={settings.onlineHistoryButtonText || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="e.g., History"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="isOnlineHistoryButtonIconEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Show Icon</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonIconEnabled" name="isOnlineHistoryButtonIconEnabled" checked={settings.isOnlineHistoryButtonIconEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                    </label>
                    <label htmlFor="isOnlineHistoryButtonShadowEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Enable Shadow</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonShadowEnabled" name="isOnlineHistoryButtonShadowEnabled" checked={settings.isOnlineHistoryButtonShadowEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                    </label>
                     <label htmlFor="isOnlineHistoryButtonFillEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Enable Fill</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonFillEnabled" name="isOnlineHistoryButtonFillEnabled" checked={settings.isOnlineHistoryButtonFillEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                    </label>
                    <label htmlFor="isOnlineHistoryButtonStrokeEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Enable Stroke</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonStrokeEnabled" name="isOnlineHistoryButtonStrokeEnabled" checked={settings.isOnlineHistoryButtonStrokeEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                    {(settings.isOnlineHistoryButtonFillEnabled) && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="onlineHistoryButtonFillColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Fill Color</label>
                                <button onClick={() => handleResetSetting('onlineHistoryButtonFillColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                            </div>
                            <input type="color" id="onlineHistoryButtonFillColor" name="onlineHistoryButtonFillColor" value={settings.onlineHistoryButtonFillColor || '#1F2937'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                        </div>
                    )}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="onlineHistoryButtonTextColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Text Color</label>
                            <button onClick={() => handleResetSetting('onlineHistoryButtonTextColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                        </div>
                        <input type="color" id="onlineHistoryButtonTextColor" name="onlineHistoryButtonTextColor" value={settings.onlineHistoryButtonTextColor || '#D1D5DB'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                    </div>
                    {(settings.isOnlineHistoryButtonStrokeEnabled) && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="onlineHistoryButtonStrokeColor" className="block text-sm font-medium text-[var(--color-text-secondary)]">Stroke Color</label>
                                <button onClick={() => handleResetSetting('onlineHistoryButtonStrokeColor')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline">Reset</button>
                            </div>
                            <input type="color" id="onlineHistoryButtonStrokeColor" name="onlineHistoryButtonStrokeColor" value={settings.onlineHistoryButtonStrokeColor || '#9CA3AF'} onChange={handleSettingsInputChange} className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md cursor-pointer"/>
                        </div>
                    )}
                </div>
            </div>

            {/* Theme Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">App Theme</h3>
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
           </div>
        );
// ... rest of the file (Security, Content, Payment, Reviews, Master cases remain unchanged) ...
      case 'security':
        return (
           <div className="space-y-6">
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
        );
      case 'content':
         return (
          <div className="space-y-6">
            {/* Session Code Management */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Session Management</h3>
                
                {/* Enable/Disable Session Code */}
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isSessionCodeEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Session Code Mode</span>
                          <p className="text-xs text-[var(--color-text-muted)]">
                              If enabled, Payment Mode will be disabled. Users need a code to start.
                          </p>
                      </div>
                      <div className="relative">
                          <input
                              type="checkbox"
                              id="isSessionCodeEnabled"
                              name="isSessionCodeEnabled"
                              checked={settings.isSessionCodeEnabled ?? true}
                              onChange={handleToggleSessionCode}
                              className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
                
                {!(settings.isSessionCodeEnabled ?? true) && !settings.isPaymentEnabled && (
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

                {(settings.isSessionCodeEnabled ?? true) && (
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
                )}
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
          </div>
         );
      case 'payment':
        return (
            <div className="space-y-6">
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                    <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Payment Mode</h3>
                    
                    {/* Enable/Disable Payment Mode */}
                    <div className="border-t border-[var(--color-border-primary)] pt-4">
                        <label htmlFor="isPaymentEnabled" className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable QRIS Payment Mode</span>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    If enabled, Session Code mode will be disabled. Users pay via QRIS to start.
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="isPaymentEnabled"
                                    name="isPaymentEnabled"
                                    checked={settings.isPaymentEnabled ?? false}
                                    onChange={handleTogglePaymentMode}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* QRIS Image Upload */}
                <div className={`p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4 ${!settings.isPaymentEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-bold text-[var(--color-text-accent)]">QRIS Image</h3>
                    <div>
                        <label htmlFor="qrisImageUrl" className="block text-sm font-medium text-[var(--color-text-secondary)]">QRIS Image URL</label>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Direct link or Google Photos Embed Link for your QRIS code.</p>
                        <input
                            type="text"
                            id="qrisImageUrl"
                            name="qrisImageUrl"
                            value={settings.qrisImageUrl || ''}
                            onChange={handleSettingsInputChange}
                            placeholder="https://..."
                            className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                        />
                    </div>
                </div>

                {/* Price Lists Management */}
                <div className={`p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4 ${!settings.isPaymentEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Price List Packages</h3>
                    
                    {/* Add New Price List */}
                    <form onSubmit={handleAddPriceList} className="bg-[var(--color-bg-tertiary)]/50 p-4 rounded-lg border border-[var(--color-border-secondary)] space-y-3">
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input
                                type="text"
                                placeholder="Package Name"
                                value={newPriceName}
                                onChange={e => setNewPriceName(e.target.value)}
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-3 py-2 text-sm"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newPriceAmount}
                                onChange={e => setNewPriceAmount(e.target.value)}
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-3 py-2 text-sm"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Sessions/Takes"
                                value={newPriceTakes}
                                onChange={e => setNewPriceTakes(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-3 py-2 text-sm"
                                required
                            />
                             <input
                                type="text"
                                placeholder="Description (optional)"
                                value={newPriceDesc}
                                onChange={e => setNewPriceDesc(e.target.value)}
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded px-3 py-2 text-sm"
                            />
                         </div>
                         <button type="submit" className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-2 rounded-md text-sm">
                             Add Package
                         </button>
                    </form>

                    {/* List Existing Packages */}
                    <div className="space-y-2 mt-4">
                        {(settings.priceLists || []).map(pkg => (
                            <div key={pkg.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-md border border-[var(--color-border-secondary)]">
                                <div>
                                    <p className="font-bold">{pkg.name} - Rp {pkg.price.toLocaleString()}</p>
                                    <p className="text-xs text-[var(--color-text-accent)] font-bold">{(pkg.maxTakes || 1)} Session(s)</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{pkg.description}</p>
                                </div>
                                <button onClick={() => handleDeletePriceList(pkg.id)} className="text-red-400 hover:text-red-300 p-2">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                        {(!settings.priceLists || settings.priceLists.length === 0) && (
                            <p className="text-center text-[var(--color-text-muted)] text-sm">No packages added.</p>
                        )}
                    </div>
                </div>

                {/* Payment History View */}
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                    <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Recent Payments</h3>
                     <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-2">
                         {payments.map(pay => (
                             <div key={pay.id} className="p-3 bg-[var(--color-bg-tertiary)] rounded flex justify-between items-center text-sm">
                                 <div>
                                     <p className="font-bold">{pay.userName}</p>
                                     <p className="text-xs text-[var(--color-text-muted)]">{pay.priceListName} - Rp {pay.amount.toLocaleString()}</p>
                                     <p className="text-[10px] text-[var(--color-text-muted)]">{new Date(pay.timestamp).toLocaleString()}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${pay.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                         {pay.status}
                                     </span>
                                     
                                     {/* WhatsApp Button for Admin */}
                                     {pay.whatsappNumber && (
                                         <button 
                                            onClick={() => handleSendWhatsApp(pay)}
                                            className="p-2 bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] rounded-full transition-colors"
                                            title="Send to WhatsApp"
                                         >
                                             <WhatsAppIcon />
                                         </button>
                                     )}

                                     <button 
                                        onClick={() => handleViewPaymentPhoto(pay)}
                                        className="p-2 bg-[var(--color-info)]/20 hover:bg-[var(--color-info)]/40 text-[var(--color-info)] rounded-full transition-colors disabled:opacity-50"
                                        title="View Photos"
                                        disabled={!!isFindingPhoto}
                                     >
                                         {isFindingPhoto === pay.id ? (
                                             <div className="animate-spin h-4 w-4 border-2 border-[var(--color-info)] border-t-transparent rounded-full"></div>
                                         ) : (
                                             <EyeIcon />
                                         )}
                                     </button>
                                     <button 
                                        onClick={() => onDeletePayment(pay.id)}
                                        className="p-2 bg-[var(--color-negative)]/20 hover:bg-[var(--color-negative)]/40 text-[var(--color-negative)] rounded-full transition-colors"
                                        title="Delete Payment"
                                     >
                                         <TrashIcon />
                                     </button>
                                 </div>
                             </div>
                         ))}
                         {payments.length === 0 && <p className="text-center text-[var(--color-text-muted)]">No payments yet.</p>}
                     </div>
                </div>
            </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6">
            {/* Review Management Button */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
              <h3 className="text-xl font-bold mb-4 text-[var(--color-text-accent)]">Review Management</h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                View and delete user-submitted reviews and testimonials.
              </p>
              <button
                onClick={onManageReviews}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105"
              >
                Manage Reviews
              </button>
            </div>

            {/* Review Reward Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Review Rewards</h3>
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isReviewForFreebieEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Reward for 5-Star Reviews</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Give users free photo sessions for leaving a 5-star review.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isReviewForFreebieEnabled" name="isReviewForFreebieEnabled" checked={settings.isReviewForFreebieEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
              {settings.isReviewForFreebieEnabled && (
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <label htmlFor="reviewFreebieTakesCount" className="block text-sm font-medium text-[var(--color-text-secondary)]">Number of Free Sessions</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">How many extra photo sessions to award.</p>
                    <input
                        type="number"
                        id="reviewFreebieTakesCount"
                        name="reviewFreebieTakesCount"
                        value={settings.reviewFreebieTakesCount ?? 1}
                        onChange={handleSettingsInputChange}
                        min="1"
                        className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                    />
                </div>
              )}
            </div>

            {/* Review Slider Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Review Slider</h3>
              <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isReviewSliderEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Show Review Slider on Welcome Screen</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Displays user reviews in a slider at the bottom.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isReviewSliderEnabled" name="isReviewSliderEnabled" checked={settings.isReviewSliderEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
              <div>
                  <label htmlFor="reviewSliderMaxDescriptionLength" className="block text-sm font-medium text-[var(--color-text-secondary)]">Max Review Length in Slider (chars)</label>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Truncates long reviews to keep the slider clean.</p>
                  <input
                      type="number"
                      id="reviewSliderMaxDescriptionLength"
                      name="reviewSliderMaxDescriptionLength"
                      value={settings.reviewSliderMaxDescriptionLength ?? 150}
                      onChange={handleSettingsInputChange}
                      min="50" max="500"
                      className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] sm:text-sm"
                  />
              </div>
            </div>
            
            {/* Rating Screen Text Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Rating Screen Text Customization</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--color-border-primary)] pt-4">
                    <div>
                        <label htmlFor="ratingScreenTitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Title</label>
                        <input type="text" id="ratingScreenTitle" name="ratingScreenTitle" value={settings.ratingScreenTitle || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenSubtitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle</label>
                        <input type="text" id="ratingScreenSubtitle" name="ratingScreenSubtitle" value={settings.ratingScreenSubtitle || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenFreebieTitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Freebie Offer Title</label>
                        <input type="text" id="ratingScreenFreebieTitle" name="ratingScreenFreebieTitle" value={settings.ratingScreenFreebieTitle || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenFreebieDescription" className="block text-sm font-medium text-[var(--color-text-secondary)]">Freebie Offer Description</label>
                        <input type="text" id="ratingScreenFreebieDescription" name="ratingScreenFreebieDescription" value={settings.ratingScreenFreebieDescription || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Use {'{count}'} as a placeholder for the number.</p>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenNameLabel" className="block text-sm font-medium text-[var(--color-text-secondary)]">"Your Name" Label</label>
                        <input type="text" id="ratingScreenNameLabel" name="ratingScreenNameLabel" value={settings.ratingScreenNameLabel || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenNamePlaceholder" className="block text-sm font-medium text-[var(--color-text-secondary)]">Name Field Placeholder</label>
                        <input type="text" id="ratingScreenNamePlaceholder" name="ratingScreenNamePlaceholder" value={settings.ratingScreenNamePlaceholder || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                     <div>
                        <label htmlFor="ratingScreenRatingLabel" className="block text-sm font-medium text-[var(--color-text-secondary)]">"Your Rating" Label</label>
                        <input type="text" id="ratingScreenRatingLabel" name="ratingScreenRatingLabel" value={settings.ratingScreenRatingLabel || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenCommentLabel" className="block text-sm font-medium text-[var(--color-text-secondary)]">"Comments" Label</label>
                        <input type="text" id="ratingScreenCommentLabel" name="ratingScreenCommentLabel" value={settings.ratingScreenCommentLabel || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                     <div className="col-span-1 sm:col-span-2">
                        <label htmlFor="ratingScreenCommentPlaceholder" className="block text-sm font-medium text-[var(--color-text-secondary)]">Comments Field Placeholder</label>
                        <textarea id="ratingScreenCommentPlaceholder" name="ratingScreenCommentPlaceholder" value={settings.ratingScreenCommentPlaceholder || ''} onChange={handleSettingsInputChange} rows={2} className="mt-1 block w-full input-style resize-none scrollbar-thin"></textarea>
                    </div>
                     <div>
                        <label htmlFor="ratingScreenSubmitButtonText" className="block text-sm font-medium text-[var(--color-text-secondary)]">Submit Button Text</label>
                        <input type="text" id="ratingScreenSubmitButtonText" name="ratingScreenSubmitButtonText" value={settings.ratingScreenSubmitButtonText || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenSkipButtonText" className="block text-sm font-medium text-[var(--color-text-secondary)]">Skip Button Text</label>
                        <input type="text" id="ratingScreenSkipButtonText" name="ratingScreenSkipButtonText" value={settings.ratingScreenSkipButtonText || ''} onChange={handleSettingsInputChange} className="mt-1 block w-full input-style"/>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'master':
        return isMasterAdmin ? (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg border text-left ${isLight ? 'bg-purple-100 border-purple-300' : 'bg-purple-900/20 border-purple-700'}`}>
              <h3 className={`text-xl font-bold ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>Master Admin Area</h3>
              <p className={`${isLight ? 'text-purple-600' : 'text-purple-200/80'} mb-4`}>Manage tenant admins who use your photobooth platform.</p>
              <button
                onClick={onManageTenants}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <UsersIcon />
                Manage Admins
              </button>
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {showPrintConfigSuccess && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <CheckIcon />
            <span className="font-bold">Settings Saved</span>
        </div>
      )}

      {/* View Photo Gallery Modal */}
      {viewingPhotos && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhotos(null)}
        >
          <div
            className="relative bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full h-full max-w-5xl flex flex-col p-4 border border-[var(--color-border-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--color-border-primary)]">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Photo Gallery ({viewingPhotos.length})
                </h3>
                <button
                  onClick={() => setViewingPhotos(null)}
                  className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-thin p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingPhotos.map((photo, index) => (
                        <div key={index} className="relative group bg-black/20 rounded-lg overflow-hidden border border-[var(--color-border-secondary)]">
                            <div className="aspect-[2/3] w-full">
                                <img
                                    src={photo.url}
                                    alt={photo.nama}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDownloadPhoto(photo)}
                                    disabled={downloadingPhotoIds.includes(photo.nama)}
                                    className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-2 px-6 rounded-full text-sm transition-transform transform hover:scale-105 flex items-center gap-2 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-wait"
                                >
                                    {downloadingPhotoIds.includes(photo.nama) ? <UploadingIcon /> : <DownloadIcon />}
                                    <span>Download</span>
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-xs text-white truncate">
                                {photo.nama}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {isGuideOpen && <KioskGuide onClose={() => setIsGuideOpen(false)} />}
      <div className="relative flex flex-col items-center w-full h-full">
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBack}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Go Back"
          >
            <BackIcon />
          </button>
        </div>
        
        <header className="text-center shrink-0 my-4">
            <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Admin Settings</h2>
        </header>
        
        <div className="w-full max-w-6xl mx-auto flex-grow flex flex-col md:flex-row gap-8 overflow-hidden px-4 pb-4">
            {/* Left Navigation */}
            <nav className="w-full md:w-1/4 lg:w-1/5 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
               <CategoryButton 
                 label="General"
                 icon={<SettingsIcon />}
                 isActive={activeCategory === 'general'}
                 onClick={() => setActiveCategory('general')}
               />
               <CategoryButton 
                 label="Appearance"
                 icon={<EyeIcon />}
                 isActive={activeCategory === 'appearance'}
                 onClick={() => setActiveCategory('appearance')}
               />
                <CategoryButton 
                 label="Security"
                 icon={<KeyIcon />}
                 isActive={activeCategory === 'security'}
                 onClick={() => setActiveCategory('security')}
               />
                <CategoryButton 
                 label="Content"
                 icon={<FolderIcon />}
                 isActive={activeCategory === 'content'}
                 onClick={() => setActiveCategory('content')}
               />
                <CategoryButton 
                 label="Payment"
                 icon={<DollarIcon />}
                 isActive={activeCategory === 'payment'}
                 onClick={() => setActiveCategory('payment')}
               />
               <CategoryButton 
                 label="Reviews"
                 icon={<ReviewsIcon />}
                 isActive={activeCategory === 'reviews'}
                 onClick={() => setActiveCategory('reviews')}
               />
               {isMasterAdmin && (
                  <CategoryButton 
                    label="Master"
                    icon={<UsersIcon />}
                    isActive={activeCategory === 'master'}
                    onClick={() => setActiveCategory('master')}
                  />
               )}
            </nav>

            {/* Right Content */}
            <main className="w-full md:w-3/4 lg:w-4/5 flex-grow overflow-y-auto scrollbar-thin md:pr-2">
                {renderContent()}
            </main>
        </div>
        <style>{`
            .input-style {
                background-color: var(--color-bg-tertiary);
                border: 1px solid var(--color-border-secondary);
                border-radius: 0.375rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                padding: 0.5rem 0.75rem;
                color: var(--color-text-primary);
            }
            .input-style {
                outline: none;
                --tw-ring-color: var(--color-border-focus);
                --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                border-color: var(--color-border-focus);
            }
        `}</style>
      </div>
    </>
  );
};

export default SettingsScreen;