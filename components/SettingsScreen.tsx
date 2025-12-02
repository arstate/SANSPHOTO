
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
import { GlobeIcon } from './icons/GlobeIcon';
import { SpeedIcon } from './icons/SpeedIcon';

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
    onAcceptPayment: (id: string) => void;
    onDeleteAllPayments: () => void;
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

type SettingsCategory = 'general' | 'appearance' | 'security' | 'content' | 'payment' | 'reviews' | 'network' | 'master';

// URL to fetch list of photos (Same as OnlineHistoryScreen)
const SCRIPT_URL_GET_HISTORY = 'https://script.google.com/macros/s/AKfycbyaHTCbrYvk4JtiZInyZilCLhYmi4dcaXmasPpV365UqdsUtftJ1FIscd1Nc4fkRYD5BA/exec';

const CategoryButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 text-left p-4 transition-all text-lg border-b-4 border-r-4 border-black border-t-2 border-l-2 mb-3 ${
      isActive
        ? 'bg-[var(--color-accent-primary)] text-white border-black translate-x-1 translate-y-1 shadow-none'
        : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    }`}
  >
    <div className={`${isActive ? 'text-white' : 'text-black'}`}>{icon}</div>
    <span className="font-bold font-mono uppercase tracking-tight">{label}</span>
  </button>
);


const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    settings, onSettingsChange, onManageTemplates, onManageEvents, onManageSessions, onManageReviews, onViewHistory, onBack,
    isMasterAdmin, onManageTenants, payments = [], onDeletePayment, onAcceptPayment, onDeleteAllPayments
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [showPrintConfigSuccess, setShowPrintConfigSuccess] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null);
  
  // Payment State
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceDesc, setNewPriceDesc] = useState('');
  const [newPriceAmount, setNewPriceAmount] = useState('');
  const [newPriceTakes, setNewPriceTakes] = useState(1);
  const [isRefreshingPayments, setIsRefreshingPayments] = useState(false);

  // View Payment Photo Gallery State
  const [viewingPhotos, setViewingPhotos] = useState<OnlineHistoryEntry[] | null>(null);
  const [isFindingPhoto, setIsFindingPhoto] = useState<string | null>(null); // Stores ID of payment being searched
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null); // Stores ID of payment being sent to WA
  const [downloadingPhotoIds, setDownloadingPhotoIds] = useState<string[]>([]);

  // Speed Test State
  const [testStatus, setTestStatus] = useState<'idle' | 'ping' | 'download' | 'upload'>('idle');
  const [pingResult, setPingResult] = useState<number | null>(null);
  const [downloadResult, setDownloadResult] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

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

  const handleRefreshPayments = () => {
      if (isRefreshingPayments) return;
      setIsRefreshingPayments(true);
      // Simulate network request/refresh delay since onValue is actually realtime
      setTimeout(() => {
          setIsRefreshingPayments(false);
      }, 1000);
  };

  const generateClientWebLink = (userName: string) => {
      const safeName = userName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
      return `${window.location.origin}/#/${safeName}`;
  };

  const handleOpenClientWeb = (userName: string) => {
      const link = generateClientWebLink(userName);
      window.open(link, '_blank');
  };

  // Send WhatsApp Logic with Web Link AND Copy Photo to Clipboard
  const handleSendWhatsapp = async (payment: PaymentEntry) => {
      if (sendingWhatsappId) return;
      setSendingWhatsappId(payment.id);

      const phone = payment.whatsappNumber!;
      const name = payment.userName;
      const webLink = generateClientWebLink(name);

      // 1. Clean number (remove non-digits)
      let cleanNumber = phone.replace(/\D/g, '');
      
      // 2. Format to international 62
      if (cleanNumber.startsWith('0')) {
          cleanNumber = '62' + cleanNumber.substring(1);
      }

      // Default message with Web Link
      const message = `Halo Kak ${name}, Terima kasih sudah menggunakan jasa photoboth dari Sans Photobooth! \uD83D\uDCF8\u2728\n\nBerikut link galeri foto khusus untuk kakak:\n${webLink}\n\nFoto bisa didownload sepuasnya dari link tersebut. Ditunggu kedatangannya kembali! \uD83E\uDD70`;

      try {
          // --- AUTO COPY PHOTO LOGIC ---
          // 1. Fetch photo list from cloud
          const response = await fetch(SCRIPT_URL_GET_HISTORY);
          if (response.ok) {
              const data: OnlineHistoryEntry[] = await response.json();
              const cleanSearchTerm = name.replace(/[-_]/g, ' ').toLowerCase().trim();
              
              // Filter photos belonging to this client
              const clientPhotos = data.filter(item => {
                  const fileName = item.nama.toLowerCase().replace(/[-_]/g, ' ');
                  return fileName.includes(cleanSearchTerm);
              });

              // Sort to get latest
              clientPhotos.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

              if (clientPhotos.length > 0) {
                  const latestPhoto = clientPhotos[0];
                  
                  // 2. Fetch Blob via Proxy (to bypass CORS for Clipboard)
                  const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(latestPhoto.url)}`;
                  const imgRes = await fetch(proxiedUrl);
                  
                  if (imgRes.ok) {
                      const blob = await imgRes.blob();
                      
                      // 3. Write to Clipboard
                      // 'ClipboardItem' is supported in secure contexts (HTTPS/localhost)
                      if (navigator.clipboard && navigator.clipboard.write) {
                          await navigator.clipboard.write([
                              new ClipboardItem({
                                  [blob.type]: blob
                              })
                          ]);
                          
                          setClipboardMessage("Foto disalin! Silakan Paste di WA.");
                          setTimeout(() => setClipboardMessage(null), 3000);
                      }
                  }
              }
          }
      } catch (err) {
          console.error("Failed to copy photo to clipboard automatically", err);
          // Non-blocking error, continue to open WhatsApp
      }

      // Open WhatsApp
      setTimeout(() => {
          setSendingWhatsappId(null);
          const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      }, 1000);
  };

  // Payment Photo Viewing Logic (Gallery Support)
  const handleViewPaymentPhoto = async (payment: PaymentEntry) => {
      if (isFindingPhoto) return;
      setIsFindingPhoto(payment.id);

      try {
          const safeUserName = payment.userName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
          if (!safeUserName) throw new Error("Invalid username format");

          // Fetch list from Google Apps Script
          const response = await fetch(SCRIPT_URL_GET_HISTORY);
          if (!response.ok) throw new Error("Failed to fetch photo list");
          
          const data: OnlineHistoryEntry[] = await response.json();
          
          // Filter photos that match the username
          const matchedPhotos = data.filter(item => 
              item.nama.includes(safeUserName)
          );

          if (matchedPhotos.length > 0) {
              matchedPhotos.sort((a, b) => b.nama.localeCompare(a.nama));
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

  const runSpeedTest = async () => {
    setPingResult(null);
    setDownloadResult(null);
    setUploadResult(null);

    // 1. PING TEST
    setTestStatus('ping');
    const startPing = performance.now();
    try {
        await fetch('https://www.gstatic.com/generate_204?t=' + Date.now(), { mode: 'no-cors', cache: 'no-store' });
        const endPing = performance.now();
        setPingResult(Math.round(endPing - startPing));
    } catch (e) {
        setPingResult(0);
    }

    // 2. DOWNLOAD TEST (Parallel Streams using Cloudflare)
    setTestStatus('download');
    setDownloadResult('0.00');

    const concurrency = 4; // Use 4 simultaneous connections to saturate bandwidth
    const targetUrl = 'https://speed.cloudflare.com/__down?bytes=50000000'; // 50MB dummy file
    const abortController = new AbortController();
    const signal = abortController.signal;

    let totalBytesReceived = 0;
    const startTime = performance.now();
    let activeStreams = 0;

    // Worker function for a single stream
    const downloadStream = async () => {
        activeStreams++;
        try {
            const response = await fetch(targetUrl, { signal });
            if (!response.body) return;
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    totalBytesReceived += value.length;
                }
            }
        } catch (e) {
            // Ignore abort errors or fetch errors
        } finally {
            activeStreams--;
        }
    };

    // Start concurrent streams
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(downloadStream());
    }

    // Interval to calculate speed every 150ms
    await new Promise<void>((resolve) => {
        const intervalId = setInterval(() => {
            const now = performance.now();
            const durationSec = (now - startTime) / 1000;

            if (durationSec > 0) {
                const bits = totalBytesReceived * 8;
                const mbps = (bits / durationSec) / 1_000_000;
                setDownloadResult(mbps.toFixed(2));
            }

            // Stop condition: Run for ~8 seconds or if all streams finished early
            if (durationSec >= 8 || activeStreams === 0) {
                clearInterval(intervalId);
                abortController.abort(); // Cancel remaining downloads
                resolve();
            }
        }, 150);
    });

    // 3. UPLOAD TEST (Posting 2MB dummy data to HttpBin)
    setTestStatus('upload');
    const ulSize = 2000000; // 2 MB
    const ulData = new Uint8Array(ulSize); 
    const ulStart = performance.now();
    try {
        await fetch('https://httpbin.org/post', {
            method: 'POST',
            body: ulData
        });
        const ulEnd = performance.now();
        const ulDuration = (ulEnd - ulStart) / 1000;
        const ulSpeed = ((ulSize * 8) / ulDuration) / 1000000;
        setUploadResult(ulSpeed.toFixed(2));
    } catch (e) {
        // Fallback for upload error (often CORS on httpbin)
        setUploadResult("Error/Blocked");
    }

    setTestStatus('idle');
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
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">General Settings</h3>
                <div>
                  <label htmlFor="countdownDuration" className="block text-sm font-bold text-black font-mono uppercase">Countdown Duration (seconds)</label>
                  <p className="text-xs text-gray-600 mb-2 font-mono">How long the countdown lasts before each photo is taken.</p>
                  <input
                      type="number"
                      id="countdownDuration"
                      name="countdownDuration"
                      value={settings.countdownDuration}
                      onChange={handleSettingsInputChange}
                      min="0"
                      className="input-style w-full"
                  />
                </div>
                <div className="border-t-2 border-black pt-4">
                  <label htmlFor="flashEffectEnabled" className="flex items-center justify-between cursor-pointer group">
                      <div>
                          <span className="block text-sm font-bold text-black font-mono uppercase">Enable Flash Effect</span>
                          <p className="text-xs text-gray-600 font-mono">Shows a white flash on screen when a photo is taken.</p>
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
                          <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.flashEffectEnabled ? 'translate-x-6' : ''}`}></div>
                          </div>
                      </div>
                  </label>
                </div>
                <div className="border-t-2 border-black pt-4">
                    <label htmlFor="maxRetakes" className="block text-sm font-bold text-black font-mono uppercase">Max Retakes per Session</label>
                    <p className="text-xs text-gray-600 mb-2 font-mono">Number of times a user can retake individual photos. Set to 0 to disable.</p>
                    <input
                        type="number"
                        id="maxRetakes"
                        name="maxRetakes"
                        value={settings.maxRetakes ?? 0}
                        onChange={handleSettingsInputChange}
                        min="0"
                        className="input-style w-full"
                    />
                </div>
            </div>

            {/* Camera Source Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2 flex items-center gap-2"><CameraIcon /> Camera Source</h3>
                <p className="text-sm text-gray-600 font-mono">Choose between the default device webcam or an external IP Camera stream.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex flex-col items-center p-4 border-2 cursor-pointer transition-all ${settings.cameraSourceType !== 'ip_camera' ? 'border-black bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-400 hover:border-black'}`}>
                        <input 
                            type="radio" 
                            name="cameraSourceType" 
                            value="default" 
                            checked={settings.cameraSourceType !== 'ip_camera'} 
                            onChange={handleSettingsInputChange} 
                            className="sr-only"
                        />
                        <span className="font-bold font-mono">Default Webcam</span>
                        <span className="text-xs text-center text-gray-600 mt-1 font-mono">Uses browser API (USB/HDMI Capture)</span>
                    </label>

                    <label className={`flex flex-col items-center p-4 border-2 cursor-pointer transition-all ${settings.cameraSourceType === 'ip_camera' ? 'border-black bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-400 hover:border-black'}`}>
                        <input 
                            type="radio" 
                            name="cameraSourceType" 
                            value="ip_camera" 
                            checked={settings.cameraSourceType === 'ip_camera'} 
                            onChange={handleSettingsInputChange} 
                            className="sr-only"
                        />
                        <span className="font-bold font-mono">IP Camera / Web Server</span>
                        <span className="text-xs text-center text-gray-600 mt-1 font-mono">MJPEG Stream via HTTP/URL</span>
                    </label>
                </div>
                
                {/* USB/Default Device Selection */}
                {settings.cameraSourceType !== 'ip_camera' && (
                    <div className="mt-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="cameraDeviceId" className="block text-sm font-bold text-black font-mono uppercase">Select Input Device</label>
                            <button 
                                onClick={refreshVideoDevices} 
                                className="text-xs text-black font-bold border-2 border-black px-2 py-1 bg-white hover:bg-gray-100 flex items-center gap-1 shadow-[2px_2px_0px_0px_black]"
                            >
                                <RestartIcon /> Refresh
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 font-mono">If using USB HDMI capture on mobile, select the USB device here.</p>
                        <select
                            id="cameraDeviceId"
                            name="cameraDeviceId"
                            value={settings.cameraDeviceId || ''}
                            onChange={handleSettingsInputChange}
                            className="input-style w-full"
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
                            <label htmlFor="ipCameraUrl" className="block text-sm font-bold text-black font-mono uppercase">HTTP Stream URL</label>
                            <p className="text-xs text-gray-600 mb-2 font-mono">e.g., http://192.168.1.24:8081 or http://192.168.1.24:8081/video</p>
                            <input
                                type="url"
                                id="ipCameraUrl"
                                name="ipCameraUrl"
                                value={settings.ipCameraUrl || ''}
                                onChange={handleSettingsInputChange}
                                placeholder="http://192.168.1..."
                                className="input-style w-full font-mono"
                            />
                        </div>

                        <label htmlFor="ipCameraUseProxy" className="flex items-center justify-between cursor-pointer p-2 bg-gray-100 border-2 border-black">
                            <div>
                                <span className="block text-sm font-bold text-black font-mono uppercase">Enable CORS Proxy</span>
                                <p className="text-xs text-gray-600 font-mono">Wraps the URL in a public proxy to bypass CORS issues.</p>
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
                                <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.ipCameraUseProxy ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            {/* Closed Mode Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Closed Mode</h3>
              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isClosedModeEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Enable Closed Mode</span>
                        <p className="text-xs text-gray-600 font-mono">Replaces the welcome screen with a countdown to reopening.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isClosedModeEnabled" name="isClosedModeEnabled" checked={settings.isClosedModeEnabled ?? false} onChange={handleToggleClosedMode} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isClosedModeEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
              {settings.isClosedModeEnabled && (
                <div className="border-t-2 border-black pt-4">
                  <label htmlFor="reopenTimestamp" className="block text-sm font-bold text-black font-mono uppercase">Reopen Date & Time</label>
                  <p className="text-xs text-gray-600 mb-2 font-mono">Set when the photobooth will be available again.</p>
                  <input
                    type="datetime-local"
                    id="reopenTimestamp"
                    name="reopenTimestamp"
                    value={formatTimestampForInput(settings.reopenTimestamp)}
                    onChange={handleSettingsInputChange}
                    className="input-style w-full"
                  />
                </div>
              )}
            </div>
            
             {/* Download Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Download Settings</h3>
              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isAutoDownloadEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Automatic Download</span>
                        <p className="text-xs text-gray-600 font-mono">Automatically start download on preview screen.</p>
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
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isAutoDownloadEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
               <div className="border-t-2 border-black pt-4">
                <label htmlFor="isDownloadButtonEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Show Manual Download Button</span>
                        <p className="text-xs text-gray-600 font-mono">Display a button for users to download manually.</p>
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
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isDownloadButtonEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
            </div>

            {/* Print Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Print Settings</h3>
              
              {/* Configure Defaults Button */}
              <div className="bg-gray-100 p-4 border-2 border-black">
                  <div className="flex justify-between items-start gap-4">
                      <div>
                          <h4 className="font-bold text-black font-mono uppercase">Printer Calibration</h4>
                          <p className="text-xs text-gray-600 mt-1 font-mono">
                              Open the browser's native print dialog to set margins, paper size, and scale as defaults.
                          </p>
                      </div>
                      <button 
                        onClick={handleConfigurePrinter}
                        className="bg-[var(--color-info)] text-black border-2 border-black font-bold py-2 px-4 shadow-[2px_2px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
                      >
                          <SettingsIcon /> Configure
                      </button>
                  </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isPrintButtonEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Enable Print Button</span>
                        <p className="text-xs text-gray-600 font-mono">Show a 'Print' button on the final preview screen.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isPrintButtonEnabled" name="isPrintButtonEnabled" checked={settings.isPrintButtonEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isPrintButtonEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>

              {(settings.isPrintButtonEnabled ?? true) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-black pt-4">
                      <div>
                        <label htmlFor="printPaperSize" className="block text-sm font-bold text-black font-mono uppercase">Paper Size</label>
                        <select id="printPaperSize" name="printPaperSize" value={settings.printPaperSize ?? '4x6'} onChange={handleSettingsInputChange} className="input-style w-full">
                          <option value="4x6">4x6 inch</option>
                          <option value="A4_portrait">A4 Portrait</option>
                          <option value="A4_landscape">A4 Landscape</option>
                        </select>
                      </div>
                       <div>
                        <label htmlFor="printColorMode" className="block text-sm font-bold text-black font-mono uppercase">Color Mode</label>
                        <select id="printColorMode" name="printColorMode" value={settings.printColorMode ?? 'color'} onChange={handleSettingsInputChange} className="input-style w-full">
                          <option value="color">Color</option>
                          <option value="grayscale">Grayscale</option>
                        </select>
                      </div>
                  </div>
                   <div className="border-t-2 border-black pt-4">
                      <label htmlFor="isPrintCopyInputEnabled" className="flex items-center justify-between cursor-pointer">
                          <div>
                              <span className="block text-sm font-bold text-black font-mono uppercase">Show 'Number of Copies' Option</span>
                              <p className="text-xs text-gray-600 font-mono">Allow users to choose how many copies to print.</p>
                          </div>
                          <div className="relative">
                              <input type="checkbox" id="isPrintCopyInputEnabled" name="isPrintCopyInputEnabled" checked={settings.isPrintCopyInputEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                              <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isPrintCopyInputEnabled ? 'translate-x-6' : ''}`}></div>
                              </div>
                          </div>
                      </label>
                  </div>
                  {(settings.isPrintCopyInputEnabled ?? true) && (
                     <div className="border-t-2 border-black pt-4">
                        <label htmlFor="printMaxCopies" className="block text-sm font-bold text-black font-mono uppercase">Maximum Copies per Print</label>
                        <p className="text-xs text-gray-600 mb-2 font-mono">Set the maximum number of copies a user can select.</p>
                        <input type="number" id="printMaxCopies" name="printMaxCopies" value={settings.printMaxCopies ?? 5} onChange={handleSettingsInputChange} min="1" className="input-style w-full" />
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
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Welcome Screen Text</h3>
              <div>
                <label htmlFor="welcomeTitle" className="block text-sm font-bold text-black font-mono uppercase">Main Title</label>
                <input
                    type="text"
                    id="welcomeTitle"
                    name="welcomeTitle"
                    value={settings.welcomeTitle || ''}
                    onChange={handleSettingsInputChange}
                    placeholder="e.g., SANS PHOTO"
                    className="input-style w-full"
                />
              </div>
              <div>
                <label htmlFor="welcomeSubtitle" className="block text-sm font-bold text-black font-mono uppercase">Subtitle</label>
                <input
                    type="text"
                    id="welcomeSubtitle"
                    name="welcomeSubtitle"
                    value={settings.welcomeSubtitle || ''}
                    onChange={handleSettingsInputChange}
                    placeholder="e.g., Your personal web photobooth"
                    className="input-style w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeTitleColor" className="block text-sm font-bold text-black font-mono uppercase">Title Color</label>
                        <button onClick={() => handleResetSetting('welcomeTitleColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                      </div>
                      <input type="color" id="welcomeTitleColor" name="welcomeTitleColor" value={settings.welcomeTitleColor || '#F9FAFB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                  </div>
                  <div>
                       <div className="flex justify-between items-center mb-1">
                        <label htmlFor="welcomeSubtitleColor" className="block text-sm font-bold text-black font-mono uppercase">Subtitle Color</label>
                        <button onClick={() => handleResetSetting('welcomeSubtitleColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                      </div>
                      <input type="color" id="welcomeSubtitleColor" name="welcomeSubtitleColor" value={settings.welcomeSubtitleColor || '#D1D5DB'} onChange={handleSettingsInputChange} className="mt-1 w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                  </div>
              </div>

               <div className="border-t-2 border-black pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeTitleFont" className="block text-sm font-bold text-black font-mono uppercase">Title Font</label>
                    <select id="welcomeTitleFont" name="welcomeTitleFont" value={settings.welcomeTitleFont} onChange={handleSettingsInputChange} className="input-style w-full">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                  <label htmlFor="isWelcomeTitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-black font-mono uppercase">Randomize Title Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeTitleFontRandom" name="isWelcomeTitleFontRandom" checked={settings.isWelcomeTitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isWelcomeTitleFontRandom ? 'translate-x-6' : ''}`}></div></div></div>
                  </label>
                </div>
                <div className="border-t-2 border-black pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeSubtitleFont" className="block text-sm font-bold text-black font-mono uppercase">Subtitle Font</label>
                    <select id="welcomeSubtitleFont" name="welcomeSubtitleFont" value={settings.welcomeSubtitleFont} onChange={handleSettingsInputChange} className="input-style w-full">
                      {GOOGLE_FONTS.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </div>
                   <label htmlFor="isWelcomeSubtitleFontRandom" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-black font-mono uppercase">Randomize Subtitle Font</span>
                    <div className="relative"><input type="checkbox" id="isWelcomeSubtitleFontRandom" name="isWelcomeSubtitleFontRandom" checked={settings.isWelcomeSubtitleFontRandom ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isWelcomeSubtitleFontRandom ? 'translate-x-6' : ''}`}></div></div></div>
                  </label>
                </div>

              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isWelcomeTextShadowEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Enable Text Shadow</span>
                        <p className="text-xs text-gray-600 font-mono">Adds a drop shadow for better readability.</p>
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
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isWelcomeTextShadowEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
            </div>
            
            {/* Floating 3D Objects Manager */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Floating 3D Objects</h3>
              <p className="text-sm text-gray-600 font-mono">Manage decorative 3D objects on the welcome screen.</p>
              
              {/* List */}
              <div className="space-y-3">
                  {currentFloatingObjects.map(obj => (
                      <div key={obj.id} className="bg-gray-50 p-3 border-2 border-black">
                          <div className="flex justify-between items-center mb-2">
                              <div>
                                  <span className="font-bold text-black">{obj.name}</span>
                                  <span className="ml-2 text-xs text-black font-mono bg-yellow-200 px-1.5 py-0.5 border border-black">
                                      {obj.type === 'built-in-camera' ? 'Built-in' : 'Custom Voxel'}
                                  </span>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleObjectToggle(obj.id)} className={`p-1.5 border-2 border-black bg-white hover:bg-gray-100 ${obj.isVisible ? 'text-green-600' : 'text-gray-400'}`}>
                                      {obj.isVisible ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                  </button>
                                  <button onClick={() => setEditingObjectId(editingObjectId === obj.id ? null : obj.id)} className={`p-1.5 border-2 border-black bg-white hover:bg-gray-100 ${editingObjectId === obj.id ? 'bg-purple-100' : ''}`}>
                                      <EditIcon />
                                  </button>
                                  <button onClick={() => handleDeleteObject(obj.id)} className="p-1.5 border-2 border-black bg-white hover:bg-red-100 text-red-500">
                                      <TrashIcon />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Inline Edit Form */}
                          {editingObjectId === obj.id && (
                              <div className="mt-4 pt-4 border-t border-black grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                                  <div>
                                      <label className="text-xs font-bold block mb-1">Scale ({obj.scale})</label>
                                      <input 
                                        type="range" min="0.1" max="3" step="0.1" 
                                        value={obj.scale} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'scale', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 appearance-none cursor-pointer border border-black"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold block mb-1">Spin Speed ({obj.spinSpeed})</label>
                                      <input 
                                        type="range" min="0" max="0.1" step="0.001" 
                                        value={obj.spinSpeed} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'spinSpeed', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 appearance-none cursor-pointer border border-black"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold block mb-1">Pos X ({obj.positionX}%)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={obj.positionX} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'positionX', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 appearance-none cursor-pointer border border-black"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold block mb-1">Pos Y ({obj.positionY}%)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={obj.positionY} 
                                        onChange={(e) => handleObjectPropertyChange(obj.id, 'positionY', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 appearance-none cursor-pointer border border-black"
                                      />
                                  </div>
                                  
                                  <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-2">
                                      <div>
                                          <label className="text-xs font-bold block mb-1">Rot X</label>
                                          <input type="number" step="0.1" value={obj.rotationX} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationX', parseFloat(e.target.value))} className="input-style w-full text-xs py-1" />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold block mb-1">Rot Y</label>
                                          <input type="number" step="0.1" value={obj.rotationY} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationY', parseFloat(e.target.value))} className="input-style w-full text-xs py-1" />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold block mb-1">Rot Z</label>
                                          <input type="number" step="0.1" value={obj.rotationZ} onChange={(e) => handleObjectPropertyChange(obj.id, 'rotationZ', parseFloat(e.target.value))} className="input-style w-full text-xs py-1" />
                                      </div>
                                  </div>

                                  <div className="col-span-1 sm:col-span-2">
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={obj.isSpinning} onChange={(e) => handleObjectPropertyChange(obj.id, 'isSpinning', e.target.checked)} className="border-2 border-black text-purple-600 focus:ring-0" />
                                        <span className="text-sm font-bold">Enable Spinning Animation</span>
                                     </label>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* Upload New */}
              <div className="border-t-2 border-black pt-4">
                 <label className="block text-sm font-bold text-black font-mono uppercase mb-2">Add Custom Voxel Object (.json)</label>
                 <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-black cursor-pointer hover:bg-yellow-100 transition-colors">
                     <div className="flex flex-col items-center">
                         <AddIcon />
                         <span className="text-xs mt-1 font-bold text-black">Click to upload JSON</span>
                     </div>
                     <input type="file" accept=".json" onChange={handleAddVoxelObject} className="hidden" />
                 </label>
                 <p className="text-xs text-gray-600 mt-2 font-mono">
                    Format: JSON array of objects with x, y, z coordinates and color hex. Example: <code>[{`{"x":0,"y":0,"z":0,"color":"#ff0000"}`}]</code>
                 </p>
              </div>

            </div>

            {/* Welcome Screen Background Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Welcome Screen Background</h3>
              <div>
                <label className="block text-sm font-bold text-black font-mono uppercase">Background Type</label>
                <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-100 p-1 border-2 border-black">
                  {(['default', 'color', 'image', 'camera'] as const).map(type => (
                    <label key={type} className={`block text-center cursor-pointer py-2 px-3 text-sm font-bold transition-colors ${settings.welcomeBgType === type ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-white text-black'}`}>
                      <input type="radio" name="welcomeBgType" value={type} checked={settings.welcomeBgType === type} onChange={handleSettingsInputChange} className="sr-only"/>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {settings.welcomeBgType === 'color' && (
                <div className="border-t-2 border-black pt-4">
                  <label htmlFor="welcomeBgColor" className="block text-sm font-bold text-black font-mono uppercase">Background Color</label>
                  <input type="color" id="welcomeBgColor" name="welcomeBgColor" value={settings.welcomeBgColor || '#111827'} onChange={handleSettingsInputChange} className="mt-1 w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                </div>
              )}

              {settings.welcomeBgType === 'image' && (
                <div className="border-t-2 border-black pt-4 space-y-4">
                  <div>
                    <label htmlFor="welcomeBgImageUrl" className="block text-sm font-bold text-black font-mono uppercase">Background Image URL</label>
                    <p className="text-xs text-gray-600 mb-2 font-mono">Use a direct image link. For Google Photos, use an embed link.</p>
                    <input
                        type="url"
                        id="welcomeBgImageUrl"
                        name="welcomeBgImageUrl"
                        value={settings.welcomeBgImageUrl || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="https://..."
                        className="input-style w-full"
                    />
                  </div>
                </div>
              )}
              
              {(settings.welcomeBgType === 'color' || settings.welcomeBgType === 'image' || settings.welcomeBgType === 'camera') && (
                 <div className="border-t-2 border-black pt-4">
                  <label htmlFor="welcomeBgZoom" className="block text-sm font-bold text-black font-mono uppercase">Zoom ({settings.welcomeBgZoom || 100}%)</label>
                  <input
                    id="welcomeBgZoom"
                    name="welcomeBgZoom"
                    type="range"
                    min="100"
                    max="300"
                    value={settings.welcomeBgZoom || 100}
                    onChange={handleSettingsInputChange}
                    className="w-full h-2 bg-gray-200 appearance-none cursor-pointer border border-black"
                  />
                </div>
              )}
            </div>
            
             {/* Start Button Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Start Button</h3>
                <div>
                    <label htmlFor="startButtonText" className="block text-sm font-bold text-black font-mono uppercase">Button Text</label>
                    <input
                        type="text"
                        id="startButtonText"
                        name="startButtonText"
                        value={settings.startButtonText || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="e.g., START SESSION"
                        className="input-style w-full"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonBgColor" className="block text-sm font-bold text-black font-mono uppercase">Background Color</label>
                            <button onClick={() => handleResetSetting('startButtonBgColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                        </div>
                        <input type="color" id="startButtonBgColor" name="startButtonBgColor" value={settings.startButtonBgColor || '#8B5CF6'} onChange={handleSettingsInputChange} className="w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="startButtonTextColor" className="block text-sm font-bold text-black font-mono uppercase">Text Color</label>
                            <button onClick={() => handleResetSetting('startButtonTextColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                        </div>
                        <input type="color" id="startButtonTextColor" name="startButtonTextColor" value={settings.startButtonTextColor || '#FFFFFF'} onChange={handleSettingsInputChange} className="w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                    </div>
                </div>
                
                <div className="border-t-2 border-black pt-4">
                    <label htmlFor="isStartButtonShadowEnabled" className="flex items-center justify-between cursor-pointer">
                        <div>
                            <span className="block text-sm font-bold text-black font-mono uppercase">Enable Button Shadow</span>
                            <p className="text-xs text-gray-600 font-mono">Adds a drop shadow to the start button.</p>
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
                            <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isStartButtonShadowEnabled ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Online History Button Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Online History Button (User)</h3>
                
                <div className="border-t-2 border-black pt-4">
                    <label htmlFor="isOnlineHistoryEnabled" className="flex items-center justify-between cursor-pointer">
                        <div>
                            <span className="block text-sm font-bold text-black font-mono uppercase">Show Online History Button</span>
                            <p className="text-xs text-gray-600 font-mono">Toggles the button's visibility on the user's welcome screen.</p>
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
                            <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isOnlineHistoryEnabled ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>
                    </label>
                </div>
                
                <div>
                    <label htmlFor="onlineHistoryButtonText" className="block text-sm font-bold text-black font-mono uppercase">Button Text</label>
                    <input
                        type="text"
                        id="onlineHistoryButtonText"
                        name="onlineHistoryButtonText"
                        value={settings.onlineHistoryButtonText || ''}
                        onChange={handleSettingsInputChange}
                        placeholder="e.g., History"
                        className="input-style w-full"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                    <label htmlFor="isOnlineHistoryButtonIconEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-black font-mono uppercase">Show Icon</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonIconEnabled" name="isOnlineHistoryButtonIconEnabled" checked={settings.isOnlineHistoryButtonIconEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isOnlineHistoryButtonIconEnabled ? 'translate-x-6' : ''}`}></div></div></div>
                    </label>
                    <label htmlFor="isOnlineHistoryButtonShadowEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-black font-mono uppercase">Enable Shadow</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonShadowEnabled" name="isOnlineHistoryButtonShadowEnabled" checked={settings.isOnlineHistoryButtonShadowEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isOnlineHistoryButtonShadowEnabled ? 'translate-x-6' : ''}`}></div></div></div>
                    </label>
                     <label htmlFor="isOnlineHistoryButtonFillEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-black font-mono uppercase">Enable Fill</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonFillEnabled" name="isOnlineHistoryButtonFillEnabled" checked={settings.isOnlineHistoryButtonFillEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isOnlineHistoryButtonFillEnabled ? 'translate-x-6' : ''}`}></div></div></div>
                    </label>
                    <label htmlFor="isOnlineHistoryButtonStrokeEnabled" className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-black font-mono uppercase">Enable Stroke</span>
                        <div className="relative"><input type="checkbox" id="isOnlineHistoryButtonStrokeEnabled" name="isOnlineHistoryButtonStrokeEnabled" checked={settings.isOnlineHistoryButtonStrokeEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" /><div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors"><div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isOnlineHistoryButtonStrokeEnabled ? 'translate-x-6' : ''}`}></div></div></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t-2 border-black pt-4">
                    {(settings.isOnlineHistoryButtonFillEnabled) && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="onlineHistoryButtonFillColor" className="block text-sm font-bold text-black font-mono uppercase">Fill Color</label>
                                <button onClick={() => handleResetSetting('onlineHistoryButtonFillColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                            </div>
                            <input type="color" id="onlineHistoryButtonFillColor" name="onlineHistoryButtonFillColor" value={settings.onlineHistoryButtonFillColor || '#1F2937'} onChange={handleSettingsInputChange} className="w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                        </div>
                    )}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="onlineHistoryButtonTextColor" className="block text-sm font-bold text-black font-mono uppercase">Text Color</label>
                            <button onClick={() => handleResetSetting('onlineHistoryButtonTextColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                        </div>
                        <input type="color" id="onlineHistoryButtonTextColor" name="onlineHistoryButtonTextColor" value={settings.onlineHistoryButtonTextColor || '#D1D5DB'} onChange={handleSettingsInputChange} className="w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                    </div>
                    {(settings.isOnlineHistoryButtonStrokeEnabled) && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="onlineHistoryButtonStrokeColor" className="block text-sm font-bold text-black font-mono uppercase">Stroke Color</label>
                                <button onClick={() => handleResetSetting('onlineHistoryButtonStrokeColor')} className="text-xs text-gray-500 hover:text-black underline font-mono">Reset</button>
                            </div>
                            <input type="color" id="onlineHistoryButtonStrokeColor" name="onlineHistoryButtonStrokeColor" value={settings.onlineHistoryButtonStrokeColor || '#9CA3AF'} onChange={handleSettingsInputChange} className="w-full h-12 p-1 bg-white border-2 border-black cursor-pointer"/>
                        </div>
                    )}
                </div>
            </div>

            {/* Theme Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">App Theme</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 font-bold py-3 px-4 transition-all border-2 border-black ${settings.theme === 'dark' || !settings.theme ? 'bg-[var(--color-bg-primary)] text-black shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  Neo-Yellow
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 font-bold py-3 px-4 transition-all border-2 border-black ${settings.theme === 'light' ? 'bg-white text-black shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-gray-200 hover:bg-gray-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  Neo-Clean
                </button>
              </div>
            </div>
           </div>
        );
      case 'security':
        return (
           <div className="space-y-6">
             {/* Security Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2 flex items-center gap-2"><KeyIcon /> Security Settings</h3>
              
              {/* PIN Lock */}
              <div className="border-t-2 border-black pt-4">
                  <label htmlFor="isPinLockEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-bold text-black font-mono uppercase">Enable PIN to Exit Fullscreen</span>
                          <p className="text-xs text-gray-600 font-mono">Requires a PIN to exit fullscreen mode.</p>
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
                          <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isPinLockEnabled ? 'translate-x-6' : ''}`}></div>
                          </div>
                      </div>
                  </label>
              </div>
              {settings.isPinLockEnabled && (
                  <div className="pt-4 space-y-2">
                      <label htmlFor="fullscreenPin" className="block text-sm font-bold text-black font-mono uppercase">Set 4-Digit PIN</label>
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
                              className="flex-grow block w-full input-style text-center tracking-[1em]"
                          />
                          <button
                              onClick={handleResetPin}
                              className="bg-orange-400 hover:bg-orange-500 text-black font-bold py-2 px-4 border-2 border-black shadow-[2px_2px_0px_0px_black] text-sm"
                          >
                              Reset
                          </button>
                      </div>
                  </div>
              )}

              {/* Strict Kiosk Mode */}
              <div className="border-t-2 border-black pt-4">
                  <label htmlFor="isStrictKioskMode" className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                          <div>
                              <span className="block text-sm font-bold text-black font-mono uppercase">Strict Kiosk Mode</span>
                              <p className="text-xs text-gray-600 font-mono">Aggressively tries to prevent exiting fullscreen. <span className="font-bold">Recommended.</span></p>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsGuideOpen(true); }} className="text-gray-500 hover:text-black"><InfoIcon /></button>
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
                          <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isStrictKioskMode ? 'translate-x-6' : ''}`}></div>
                          </div>
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
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Session Management</h3>
                
                {/* Enable/Disable Session Code */}
                <div className="border-t-2 border-black pt-4">
                  <label htmlFor="isSessionCodeEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-bold text-black font-mono uppercase">Enable Session Code Mode</span>
                          <p className="text-xs text-gray-600 font-mono">
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
                          <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isSessionCodeEnabled ? 'translate-x-6' : ''}`}></div>
                          </div>
                      </div>
                  </label>
                </div>
                
                {!(settings.isSessionCodeEnabled ?? true) && !settings.isPaymentEnabled && (
                  <div className="border-t-2 border-black pt-4">
                    <label htmlFor="freePlayMaxTakes" className="block text-sm font-bold text-black font-mono uppercase">Takes per Free Session</label>
                    <p className="text-xs text-gray-600 mb-2 font-mono">Number of photo takes a user gets in free play mode.</p>
                    <input
                        type="number"
                        id="freePlayMaxTakes"
                        name="freePlayMaxTakes"
                        value={settings.freePlayMaxTakes || 1}
                        onChange={handleSettingsInputChange}
                        min="1"
                        className="input-style w-full"
                    />
                  </div>
                )}

                {(settings.isSessionCodeEnabled ?? true) && (
                    <div className="pt-4">
                    <p className="text-gray-600 mb-4 text-sm font-mono">
                        Generate and manage single-use session codes for users to start the photobooth.
                    </p>
                    <button
                        onClick={onManageSessions}
                        className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] flex items-center justify-center gap-2"
                    >
                        <TicketIcon />
                        Manage Session Codes
                    </button>
                    </div>
                )}
              </div>

             {/* Event Management */}
              <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                <h3 className="text-xl font-bold mb-4 font-bebas tracking-wider text-black border-b-2 border-black pb-2">Event Management</h3>
                <p className="text-gray-600 mb-4 font-mono text-sm">
                  Create, manage, and archive events. Assign specific templates to each event.
                </p>
                <button
                  onClick={onManageEvents}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                >
                  Manage Events
                </button>
              </div>

              {/* Template Settings */}
              <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                <h3 className="text-xl font-bold mb-4 font-bebas tracking-wider text-black border-b-2 border-black pb-2">Template Library</h3>
                <p className="text-gray-600 mb-4 font-mono text-sm">
                  Add, edit, or delete photobooth templates from your global library.
                </p>
                <button
                  onClick={onManageTemplates}
                  className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                >
                  Manage All Templates
                </button>
              </div>
              
              {/* History */}
              <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                  <h3 className="text-xl font-bold mb-4 font-bebas tracking-wider text-black border-b-2 border-black pb-2">Photobooth History</h3>
                  <p className="text-gray-600 mb-4 font-mono text-sm">
                      View, filter, and manage all photos taken during events.
                  </p>
                  <button
                      onClick={onViewHistory}
                      className="w-full bg-[var(--color-info)] hover:bg-[var(--color-info-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                  >
                      View Photobooth History
                  </button>
              </div>
          </div>
         );
      case 'payment':
        return (
            <div className="space-y-6">
                <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                    <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Payment Mode</h3>
                    
                    {/* Enable/Disable Payment Mode */}
                    <div className="border-t-2 border-black pt-4">
                        <label htmlFor="isPaymentEnabled" className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span className="block text-sm font-bold text-black font-mono uppercase">Enable QRIS Payment Mode</span>
                                <p className="text-xs text-gray-600 font-mono">
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
                                <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isPaymentEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* QRIS Image Upload */}
                <div className={`p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4 ${!settings.isPaymentEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">QRIS Image</h3>
                    <div>
                        <label htmlFor="qrisImageUrl" className="block text-sm font-bold text-black font-mono uppercase">QRIS Image URL</label>
                        <p className="text-xs text-gray-600 mb-2 font-mono">Direct link or Google Photos Embed Link for your QRIS code.</p>
                        <input
                            type="text"
                            id="qrisImageUrl"
                            name="qrisImageUrl"
                            value={settings.qrisImageUrl || ''}
                            onChange={handleSettingsInputChange}
                            placeholder="https://..."
                            className="input-style w-full"
                        />
                    </div>
                </div>

                {/* Price Lists Management */}
                <div className={`p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4 ${!settings.isPaymentEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Price List Packages</h3>
                    
                    {/* Add New Price List */}
                    <form onSubmit={handleAddPriceList} className="bg-gray-100 p-4 border-2 border-black space-y-3">
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input
                                type="text"
                                placeholder="Package Name"
                                value={newPriceName}
                                onChange={e => setNewPriceName(e.target.value)}
                                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newPriceAmount}
                                onChange={e => setNewPriceAmount(e.target.value)}
                                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Sessions/Takes"
                                value={newPriceTakes}
                                onChange={e => setNewPriceTakes(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold"
                                required
                            />
                             <input
                                type="text"
                                placeholder="Description (optional)"
                                value={newPriceDesc}
                                onChange={e => setNewPriceDesc(e.target.value)}
                                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold"
                            />
                         </div>
                         <button type="submit" className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-black font-bold py-2 border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm uppercase">
                             Add Package
                         </button>
                    </form>

                    {/* List Existing Packages */}
                    <div className="space-y-2 mt-4">
                        {(settings.priceLists || []).map(pkg => (
                            <div key={pkg.id} className="flex items-center justify-between p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_black]">
                                <div>
                                    <p className="font-bold text-black uppercase">{pkg.name} - Rp {pkg.price.toLocaleString()}</p>
                                    <p className="text-xs text-[var(--color-accent-primary)] font-bold">{(pkg.maxTakes || 1)} Session(s)</p>
                                    <p className="text-xs text-gray-600">{pkg.description}</p>
                                </div>
                                <button onClick={() => handleDeletePriceList(pkg.id)} className="text-red-500 hover:text-red-700 p-2 border-2 border-transparent hover:border-black">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                        {(!settings.priceLists || settings.priceLists.length === 0) && (
                            <p className="text-center text-gray-500 text-sm font-mono">No packages added.</p>
                        )}
                    </div>
                </div>

                {/* Payment History View */}
                <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                    <div className="flex justify-between items-center border-b-2 border-black pb-2">
                        <h3 className="text-xl font-bold font-bebas tracking-wider text-black">Recent Payments</h3>
                        <button 
                            onClick={handleRefreshPayments}
                            className={`p-2 bg-white border-2 border-black hover:bg-gray-100 transition-all text-black shadow-[2px_2px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${isRefreshingPayments ? 'animate-spin text-[var(--color-accent-primary)]' : ''}`}
                            title="Refresh List"
                            disabled={isRefreshingPayments}
                        >
                            <RestartIcon />
                        </button>
                    </div>
                    
                    <div className="relative min-h-[150px]">
                        {isRefreshingPayments && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-fade-in border-2 border-black">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
                                <p className="text-xs text-black font-bold font-mono">Refreshing...</p>
                            </div>
                        )}
                        
                        <div className="max-h-[600px] overflow-y-auto scrollbar-thin space-y-2 pr-1">
                            {payments.map(pay => (
                                <div key={pay.id} className="p-3 bg-white border-2 border-black flex justify-between items-center text-sm shadow-[2px_2px_0px_0px_gray]">
                                    <div>
                                        <p className="font-bold text-black uppercase">{pay.userName}</p>
                                        <p className="text-xs text-gray-600 font-mono">{pay.priceListName} - Rp {pay.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{new Date(pay.timestamp).toLocaleString()}</p>
                                        {pay.whatsappNumber && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-bold">
                                                <WhatsAppIcon /> {pay.whatsappNumber}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase ${pay.status === 'verified' ? 'bg-green-300 text-black' : 'bg-yellow-300 text-black'}`}>
                                            {pay.status}
                                        </span>
                                        {pay.status === 'pending' && (
                                            <button 
                                                onClick={() => onAcceptPayment(pay.id)}
                                                className="p-1.5 bg-green-200 hover:bg-green-300 text-black border-2 border-black transition-colors"
                                                title="Accept Payment"
                                            >
                                                <CheckIcon />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleViewPaymentPhoto(pay)}
                                            className="p-1.5 bg-blue-200 hover:bg-blue-300 text-black border-2 border-black transition-colors disabled:opacity-50"
                                            title="View Photos"
                                            disabled={!!isFindingPhoto}
                                        >
                                            {isFindingPhoto === pay.id ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                                            ) : (
                                                <EyeIcon />
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => handleOpenClientWeb(pay.userName)}
                                            className="p-1.5 bg-purple-200 hover:bg-purple-300 text-black border-2 border-black transition-colors"
                                            title="Open Web Link"
                                        >
                                            <GlobeIcon />
                                        </button>
                                        {pay.whatsappNumber && (
                                            <button 
                                                onClick={() => handleSendWhatsapp(pay)}
                                                className="p-1.5 bg-green-200 hover:bg-green-300 text-black border-2 border-black transition-colors disabled:opacity-50"
                                                title="Send Web Link to WhatsApp"
                                                disabled={!!sendingWhatsappId}
                                            >
                                                {sendingWhatsappId === pay.id ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                                                ) : (
                                                    <WhatsAppIcon />
                                                )}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => onDeletePayment(pay.id)}
                                            className="p-1.5 bg-red-200 hover:bg-red-300 text-black border-2 border-black transition-colors"
                                            title="Delete Payment"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && <p className="text-center text-gray-500 py-10 font-mono">No payments yet.</p>}
                        </div>
                    </div>
                    {payments.length > 0 && (
                        <div className="flex justify-end pt-4 border-t-2 border-black">
                            <button
                                onClick={onDeleteAllPayments}
                                className="bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-white font-bold py-2 px-6 text-sm transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[2px_2px_0px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
                            >
                                <TrashIcon />
                                Hapus Semua Riwayat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6">
            {/* Review Management Button */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
              <h3 className="text-xl font-bold mb-4 font-bebas tracking-wider text-black border-b-2 border-black pb-2">Review Management</h3>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                View and delete user-submitted reviews and testimonials.
              </p>
              <button
                onClick={onManageReviews}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
              >
                Manage Reviews
              </button>
            </div>

            {/* Review Reward Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Review Rewards</h3>
              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isReviewForFreebieEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Reward for 5-Star Reviews</span>
                        <p className="text-xs text-gray-600 font-mono">Give users free photo sessions for leaving a 5-star review.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isReviewForFreebieEnabled" name="isReviewForFreebieEnabled" checked={settings.isReviewForFreebieEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isReviewForFreebieEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
              {settings.isReviewForFreebieEnabled && (
                <div className="border-t-2 border-black pt-4">
                    <label htmlFor="reviewFreebieTakesCount" className="block text-sm font-bold text-black font-mono uppercase">Number of Free Sessions</label>
                    <p className="text-xs text-gray-600 mb-2 font-mono">How many extra photo sessions to award.</p>
                    <input
                        type="number"
                        id="reviewFreebieTakesCount"
                        name="reviewFreebieTakesCount"
                        value={settings.reviewFreebieTakesCount ?? 1}
                        onChange={handleSettingsInputChange}
                        min="1"
                        className="input-style w-full"
                    />
                </div>
              )}
            </div>

            {/* Review Slider Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
              <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Review Slider</h3>
              <div className="border-t-2 border-black pt-4">
                <label htmlFor="isReviewSliderEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-bold text-black font-mono uppercase">Show Review Slider on Welcome Screen</span>
                        <p className="text-xs text-gray-600 font-mono">Displays user reviews in a slider at the bottom.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isReviewSliderEnabled" name="isReviewSliderEnabled" checked={settings.isReviewSliderEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-300 border-2 border-black peer-checked:bg-[var(--color-accent-primary)] transition-colors">
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black transition-transform ${settings.isReviewSliderEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </label>
              </div>
              <div>
                  <label htmlFor="reviewSliderMaxDescriptionLength" className="block text-sm font-bold text-black font-mono uppercase">Max Review Length in Slider (chars)</label>
                  <p className="text-xs text-gray-600 mb-2 font-mono">Truncates long reviews to keep the slider clean.</p>
                  <input
                      type="number"
                      id="reviewSliderMaxDescriptionLength"
                      name="reviewSliderMaxDescriptionLength"
                      value={settings.reviewSliderMaxDescriptionLength ?? 150}
                      onChange={handleSettingsInputChange}
                      min="50" max="500"
                      className="input-style w-full"
                  />
              </div>
            </div>
            
            {/* Rating Screen Text Customization */}
            <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
                <h3 className="text-xl font-bold font-bebas tracking-wider text-black border-b-2 border-black pb-2">Rating Screen Text Customization</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-black pt-4">
                    <div>
                        <label htmlFor="ratingScreenTitle" className="block text-sm font-bold text-black font-mono uppercase">Title</label>
                        <input type="text" id="ratingScreenTitle" name="ratingScreenTitle" value={settings.ratingScreenTitle || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenSubtitle" className="block text-sm font-bold text-black font-mono uppercase">Subtitle</label>
                        <input type="text" id="ratingScreenSubtitle" name="ratingScreenSubtitle" value={settings.ratingScreenSubtitle || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenFreebieTitle" className="block text-sm font-bold text-black font-mono uppercase">Freebie Offer Title</label>
                        <input type="text" id="ratingScreenFreebieTitle" name="ratingScreenFreebieTitle" value={settings.ratingScreenFreebieTitle || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenFreebieDescription" className="block text-sm font-bold text-black font-mono uppercase">Freebie Offer Description</label>
                        <input type="text" id="ratingScreenFreebieDescription" name="ratingScreenFreebieDescription" value={settings.ratingScreenFreebieDescription || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                        <p className="text-xs text-gray-600 mt-1 font-mono">Use {'{count}'} as a placeholder for the number.</p>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenNameLabel" className="block text-sm font-bold text-black font-mono uppercase">"Your Name" Label</label>
                        <input type="text" id="ratingScreenNameLabel" name="ratingScreenNameLabel" value={settings.ratingScreenNameLabel || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenNamePlaceholder" className="block text-sm font-bold text-black font-mono uppercase">Name Field Placeholder</label>
                        <input type="text" id="ratingScreenNamePlaceholder" name="ratingScreenNamePlaceholder" value={settings.ratingScreenNamePlaceholder || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                     <div>
                        <label htmlFor="ratingScreenRatingLabel" className="block text-sm font-bold text-black font-mono uppercase">"Your Rating" Label</label>
                        <input type="text" id="ratingScreenRatingLabel" name="ratingScreenRatingLabel" value={settings.ratingScreenRatingLabel || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenCommentLabel" className="block text-sm font-bold text-black font-mono uppercase">"Comments" Label</label>
                        <input type="text" id="ratingScreenCommentLabel" name="ratingScreenCommentLabel" value={settings.ratingScreenCommentLabel || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                     <div className="col-span-1 sm:col-span-2">
                        <label htmlFor="ratingScreenCommentPlaceholder" className="block text-sm font-bold text-black font-mono uppercase">Comments Field Placeholder</label>
                        <textarea id="ratingScreenCommentPlaceholder" name="ratingScreenCommentPlaceholder" value={settings.ratingScreenCommentPlaceholder || ''} onChange={handleSettingsInputChange} rows={2} className="input-style w-full resize-none scrollbar-thin"></textarea>
                    </div>
                     <div>
                        <label htmlFor="ratingScreenSubmitButtonText" className="block text-sm font-bold text-black font-mono uppercase">Submit Button Text</label>
                        <input type="text" id="ratingScreenSubmitButtonText" name="ratingScreenSubmitButtonText" value={settings.ratingScreenSubmitButtonText || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                    <div>
                        <label htmlFor="ratingScreenSkipButtonText" className="block text-sm font-bold text-black font-mono uppercase">Skip Button Text</label>
                        <input type="text" id="ratingScreenSkipButtonText" name="ratingScreenSkipButtonText" value={settings.ratingScreenSkipButtonText || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'network':
        return (
            <div className="space-y-6">
                <div className="p-6 bg-[var(--color-bg-secondary)] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left">
                    <h3 className="text-xl font-bold text-black mb-4 font-bebas tracking-wider flex items-center gap-2 border-b-2 border-black pb-2">
                        <SpeedIcon /> Internet Speed Test
                    </h3>
                    <p className="text-gray-600 mb-6 font-mono text-sm">
                        Test your connection speed (Ping, Download, Upload) to ensure smooth photo uploading.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Ping Gauge */}
                        <div className="bg-white p-4 flex flex-col items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-black text-sm uppercase tracking-wider mb-2 font-bold">Ping</span>
                            <div className="flex items-end gap-1">
                                {testStatus === 'ping' ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-primary)] mb-2"></div>
                                ) : (
                                    <span className="text-4xl font-bebas text-black">{pingResult !== null ? pingResult : '-'}</span>
                                )}
                                <span className="text-sm text-gray-600 mb-1 font-mono">ms</span>
                            </div>
                        </div>

                        {/* Download Gauge */}
                        <div className="bg-white p-4 flex flex-col items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-black text-sm uppercase tracking-wider mb-2 font-bold">Download</span>
                            <div className="flex items-end gap-1">
                                {testStatus === 'download' ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                                ) : (
                                    <span className="text-4xl font-bebas text-black">{downloadResult !== null ? downloadResult : '-'}</span>
                                )}
                                <span className="text-sm text-gray-600 mb-1 font-mono">Mbps</span>
                            </div>
                        </div>

                        {/* Upload Gauge */}
                        <div className="bg-white p-4 flex flex-col items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-black text-sm uppercase tracking-wider mb-2 font-bold">Upload</span>
                            <div className="flex items-end gap-1">
                                {testStatus === 'upload' ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                                ) : (
                                    <span className="text-4xl font-bebas text-black">{uploadResult !== null ? uploadResult : '-'}</span>
                                )}
                                <span className="text-sm text-gray-600 mb-1 font-mono">Mbps</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={runSpeedTest}
                            disabled={testStatus !== 'idle'}
                            className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-8 text-xl transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] mx-auto disabled:bg-gray-300 disabled:cursor-wait"
                        >
                            {testStatus !== 'idle' ? 'Running Test...' : 'Start Speed Test'}
                        </button>
                        {testStatus !== 'idle' && (
                            <p className="mt-4 text-xs text-gray-600 animate-pulse font-mono">Testing {testStatus} speed...</p>
                        )}
                    </div>
                </div>
            </div>
        );
      case 'master':
        return isMasterAdmin ? (
          <div className="space-y-6">
            <div className={`p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left bg-purple-100`}>
              <h3 className={`text-xl font-bold text-black border-b-2 border-black pb-2 font-bebas tracking-wider`}>Master Admin Area</h3>
              <p className={`text-gray-700 mb-4 font-mono text-sm`}>Manage tenant admins who use your photobooth platform.</p>
              <button
                onClick={onManageTenants}
                className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-bold py-3 px-6 text-lg transition-transform transform hover:translate-y-[-2px] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] flex items-center justify-center gap-2"
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
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-400 border-2 border-black text-black px-6 py-3 shadow-[4px_4px_0px_0px_black] flex items-center gap-2 animate-bounce">
            <CheckIcon />
            <span className="font-bold font-mono">Settings Saved</span>
        </div>
      )}
      
      {/* Copy Toast Notification */}
      {clipboardMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 bg-[var(--color-accent-primary)] border-2 border-black text-white px-6 py-3 shadow-[4px_4px_0px_0px_black] flex items-center gap-2 animate-fade-in-up">
            <CheckIcon />
            <span className="font-bold font-mono">{clipboardMessage}</span>
        </div>
      )}

      {/* View Photo Gallery Modal */}
      {viewingPhotos && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhotos(null)}
        >
          <div
            className="relative bg-[var(--color-bg-secondary)] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] w-full h-full max-w-5xl flex flex-col p-4 border-2 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-black">
                <h3 className="text-xl font-bold text-black font-bebas tracking-wide">
                    Photo Gallery ({viewingPhotos.length})
                </h3>
                <button
                  onClick={() => setViewingPhotos(null)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-thin p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingPhotos.map((photo, index) => (
                        <div key={index} className="relative group bg-gray-200 overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                            <div className="aspect-[2/3] w-full">
                                <img
                                    src={photo.url}
                                    alt={photo.nama}
                                    className="w-full h-full object-contain bg-white"
                                    loading="lazy"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDownloadPhoto(photo)}
                                    disabled={downloadingPhotoIds.includes(photo.nama)}
                                    className="bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-black font-bold py-2 px-6 text-sm transition-transform transform hover:scale-105 border-2 border-black shadow-[2px_2px_0px_0px_black] flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-wait"
                                >
                                    {downloadingPhotoIds.includes(photo.nama) ? <UploadingIcon /> : <DownloadIcon />}
                                    <span>Download</span>
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2 text-xs text-black font-bold truncate">
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
      <div className="relative flex flex-col items-center w-full h-full bg-[var(--color-bg-primary)]">
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBack}
            className="bg-white hover:bg-gray-100 text-black border-2 border-black font-bold p-3 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            aria-label="Go Back"
          >
            <BackIcon />
          </button>
        </div>
        
        <header className="text-center shrink-0 my-4">
            <h2 className="text-5xl font-bebas tracking-widest text-black drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">Admin Settings</h2>
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
               <CategoryButton 
                 label="Network"
                 icon={<SpeedIcon />}
                 isActive={activeCategory === 'network'}
                 onClick={() => setActiveCategory('network')}
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
                background-color: #FFFFFF;
                border: 2px solid #000000;
                box-shadow: 2px 2px 0px 0px #000000;
                padding: 0.5rem 0.75rem;
                color: #000000;
                font-family: 'Roboto Mono', monospace;
                font-weight: bold;
                transition: all 0.1s;
            }
            .input-style:focus {
                outline: none;
                background-color: #FEF3C7;
                box-shadow: 4px 4px 0px 0px #000000;
                transform: translate(-1px, -1px);
            }
        `}</style>
      </div>
    </>
  );
};

export default SettingsScreen;
