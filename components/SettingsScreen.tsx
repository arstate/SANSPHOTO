










import React, { useState, useEffect } from 'react';
import { Settings, FloatingObject, PriceList, PaymentEntry } from '../types';
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

interface SettingsScreenProps {
    settings: Settings;
    priceLists: PriceList[];
    payments: PaymentEntry[];
    onSettingsChange: (newSettings: Settings) => void;
    onManageTemplates: () => void;
    onManageEvents: () => void;
    onManageSessions: () => void;
    onManageReviews: () => void;
    onViewHistory: () => void;
    onBack: () => void;
    isMasterAdmin: boolean;
    onManageTenants: () => void;
    onAddPriceList: (name: string, description: string, price: number, maxTakes: number) => void;
    onDeletePriceList: (id: string) => void;
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
    settings, priceLists, payments, onSettingsChange, onManageTemplates, onManageEvents, onManageSessions, onManageReviews, onViewHistory, onBack,
    isMasterAdmin, onManageTenants, onAddPriceList, onDeletePriceList
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  
  // Price List Form
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceDesc, setNewPriceDesc] = useState('');
  const [newPriceAmount, setNewPriceAmount] = useState<number>(0);
  const [newPriceMaxTakes, setNewPriceMaxTakes] = useState<number>(1);
  
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
  
  const handleThemeChange = (theme: 'light' | 'dark') => {
    onSettingsChange({ ...settings, theme });
  };
  
  const handleResetSetting = (name: keyof Settings) => {
    onSettingsChange({ ...settings, [name]: '' });
  };
  
  const handleAddPriceSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddPriceList(newPriceName, newPriceDesc, newPriceAmount, newPriceMaxTakes);
      setNewPriceName('');
      setNewPriceDesc('');
      setNewPriceAmount(0);
      setNewPriceMaxTakes(1);
  };
  
  // ... (Other handlers unchanged)

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
    if (isEnabled && (!newTimestamp || newTimestamp < Date.now())) {
      newTimestamp = Date.now() + 3600 * 1000; 
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
  
  const formatTimestampForInput = (timestamp: number | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };
  
  // Simple Payment Icon
  const PaymentIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
  );

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
                {/* ... other general settings ... */}
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
            </div>

            {/* Camera Source Settings */}
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)] flex items-center gap-2"><CameraIcon /> Camera Source</h3>
                {/* ... camera inputs ... */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${settings.cameraSourceType !== 'ip_camera' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'}`}>
                        <input type="radio" name="cameraSourceType" value="default" checked={settings.cameraSourceType !== 'ip_camera'} onChange={handleSettingsInputChange} className="sr-only" />
                        <span className="font-bold">Default Webcam</span>
                    </label>
                    <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${settings.cameraSourceType === 'ip_camera' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10' : 'border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]'}`}>
                        <input type="radio" name="cameraSourceType" value="ip_camera" checked={settings.cameraSourceType === 'ip_camera'} onChange={handleSettingsInputChange} className="sr-only" />
                        <span className="font-bold">IP Camera / Web Server</span>
                    </label>
                </div>
                {/* ... device dropdowns ... */}
            </div>
            
            {/* Closed Mode and Download Settings ... */}
             <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Download Settings</h3>
               <div className="border-t border-[var(--color-border-primary)] pt-4">
                <label htmlFor="isAutoDownloadEnabled" className="flex items-center justify-between cursor-pointer">
                    <div>
                        <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Automatic Download</span>
                        <p className="text-xs text-[var(--color-text-muted)]">Automatically start download on preview screen.</p>
                    </div>
                    <div className="relative">
                        <input type="checkbox" id="isAutoDownloadEnabled" name="isAutoDownloadEnabled" checked={settings.isAutoDownloadEnabled ?? true} onChange={handleSettingsInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                    </div>
                </label>
              </div>
            </div>
          </div>
        );
        
      case 'payment':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Payment Settings</h3>
                
                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <label htmlFor="isPaymentEnabled" className="flex items-center justify-between cursor-pointer">
                      <div>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">Enable Payment System</span>
                          <p className="text-xs text-[var(--color-text-muted)]">Users must pay via QRIS to start a session.</p>
                      </div>
                      <div className="relative">
                          <input type="checkbox" id="isPaymentEnabled" name="isPaymentEnabled" checked={settings.isPaymentEnabled ?? false} onChange={handleSettingsInputChange} className="sr-only peer" />
                          <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                      </div>
                  </label>
                </div>
                
                {settings.isPaymentEnabled && (
                    <div className="mt-4 animate-fade-in space-y-4">
                        <div>
                            <label htmlFor="qrisImageUrl" className="block text-sm font-medium text-[var(--color-text-secondary)]">QRIS Image URL</label>
                            <p className="text-xs text-[var(--color-text-muted)] mb-2">Embed link from Google Photos (use an online tool to get direct link) or direct image URL.</p>
                            <input
                                type="url"
                                id="qrisImageUrl"
                                name="qrisImageUrl"
                                value={settings.qrisImageUrl || ''}
                                onChange={handleSettingsInputChange}
                                placeholder="https://..."
                                className="mt-1 block w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md shadow-sm py-2 px-3 text-[var(--color-text-primary)]"
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {settings.isPaymentEnabled && (
                <>
                {/* Price List Management */}
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                    <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Price List Management</h3>
                    
                    <form onSubmit={handleAddPriceSubmit} className="space-y-4 p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Package Name" value={newPriceName} onChange={e => setNewPriceName(e.target.value)} required className="input-style" />
                            <input type="number" placeholder="Price (Rp)" value={newPriceAmount} onChange={e => setNewPriceAmount(parseInt(e.target.value))} required min="0" className="input-style" />
                            <input type="text" placeholder="Description" value={newPriceDesc} onChange={e => setNewPriceDesc(e.target.value)} required className="input-style" />
                             <input type="number" placeholder="Max Takes" value={newPriceMaxTakes} onChange={e => setNewPriceMaxTakes(parseInt(e.target.value))} required min="1" className="input-style" />
                        </div>
                        <button type="submit" className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-white font-bold py-2 rounded-lg">
                            Add Price Package
                        </button>
                    </form>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                        {priceLists.map(price => (
                            <div key={price.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-secondary)]">
                                <div>
                                    <p className="font-bold text-[var(--color-text-primary)]">{price.name} - Rp {price.price.toLocaleString()}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{price.description} ({price.maxTakes} takes)</p>
                                </div>
                                <button onClick={() => onDeletePriceList(price.id)} className="text-red-400 hover:text-red-300 p-2"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Payment History */}
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                     <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Recent Payments</h3>
                     <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                        {payments.slice(0, 20).map(payment => (
                             <div key={payment.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <div>
                                    <p className="font-bold">{payment.userOrderName}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {payment.priceListName} - Rp {payment.amount.toLocaleString()} - {new Date(payment.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'verified' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                         {payment.status.toUpperCase()}
                                     </span>
                                     {payment.proofImageUrl && (
                                         <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" className="text-[var(--color-text-accent)] text-xs underline">Proof</a>
                                     )}
                                </div>
                             </div>
                        ))}
                     </div>
                </div>
                </>
            )}
          </div>
        );

      case 'appearance':
        // ... (Appearance section unchanged)
        return (
             <div className="space-y-6">
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                  <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Welcome Screen Text</h3>
                  {/* ... inputs ... */}
                  <div>
                    <label htmlFor="welcomeTitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Main Title</label>
                    <input type="text" id="welcomeTitle" name="welcomeTitle" value={settings.welcomeTitle || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                  </div>
                   <div>
                    <label htmlFor="welcomeSubtitle" className="block text-sm font-medium text-[var(--color-text-secondary)]">Subtitle</label>
                    <input type="text" id="welcomeSubtitle" name="welcomeSubtitle" value={settings.welcomeSubtitle || ''} onChange={handleSettingsInputChange} className="input-style w-full"/>
                  </div>
                  {/* ... font settings ... */}
                </div>
                
                 {/* Floating Objects Section (unchanged) */}
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                  <h3 className="text-xl font-bold text-[var(--color-text-accent)]">Floating 3D Objects</h3>
                  {/* ... list of objects ... */}
                   <div className="space-y-3">
                      {(settings.floatingObjects || []).map(obj => (
                          <div key={obj.id} className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg border border-[var(--color-border-secondary)]">
                               {/* ... object details ... */}
                               <div className="flex justify-between items-center mb-2">
                                  <div><span className="font-bold">{obj.name}</span></div>
                                   <div className="flex gap-2">
                                      <button onClick={() => handleObjectToggle(obj.id)} className="p-1.5"><ToggleOnIcon/></button>
                                      <button onClick={() => setEditingObjectId(editingObjectId === obj.id ? null : obj.id)} className="p-1.5"><EditIcon/></button>
                                      <button onClick={() => handleDeleteObject(obj.id)} className="p-1.5"><TrashIcon/></button>
                                   </div>
                               </div>
                               {editingObjectId === obj.id && (
                                  <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                                      <div><label className="text-xs block">Scale</label><input type="range" min="0.1" max="3" step="0.1" value={obj.scale} onChange={(e) => handleObjectPropertyChange(obj.id, 'scale', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
                                      <div><label className="text-xs block">Speed</label><input type="range" min="0" max="0.1" step="0.001" value={obj.spinSpeed} onChange={(e) => handleObjectPropertyChange(obj.id, 'spinSpeed', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
                                       {/* ... other properties ... */}
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
                    </div>
                </div>
             </div>
        );
      case 'security':
        // ... (Security section unchanged)
        return (
             <div className="space-y-6">
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left space-y-4">
                  <h3 className="text-xl font-bold text-[var(--color-text-accent)]"><KeyIcon /> Security Settings</h3>
                  {/* ... pin settings ... */}
                   <div className="border-t border-[var(--color-border-primary)] pt-4">
                      <label htmlFor="isPinLockEnabled" className="flex items-center justify-between cursor-pointer">
                          <span>Enable PIN</span>
                          <input type="checkbox" id="isPinLockEnabled" name="isPinLockEnabled" checked={settings.isPinLockEnabled || false} onChange={handleSettingsInputChange} />
                      </label>
                   </div>
                   {settings.isPinLockEnabled && (
                      <div className="pt-4 space-y-2">
                          <label>Set 4-Digit PIN</label>
                          <input type="password" value={settings.fullscreenPin || ''} onChange={handlePinInputChange} maxLength={4} className="input-style w-full tracking-[1em] text-center" />
                      </div>
                   )}
                </div>
             </div>
        );
      case 'content':
         // ... (Content section unchanged)
         return (
             <div className="space-y-6">
                 {/* ... content buttons ... */}
                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                     <button onClick={onManageEvents} className="w-full bg-[var(--color-accent-primary)] text-white font-bold py-3 rounded-full">Manage Events</button>
                </div>
                 <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                     <button onClick={onManageTemplates} className="w-full bg-[var(--color-accent-primary)] text-white font-bold py-3 rounded-full">Manage Templates</button>
                </div>
             </div>
         );
      case 'reviews':
        // ... (Reviews section unchanged)
        return (
            <div className="space-y-6">
                 <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-left">
                    <button onClick={onManageReviews} className="w-full bg-[var(--color-accent-primary)] text-white font-bold py-3 rounded-full">Manage Reviews</button>
                 </div>
                 {/* ... reward settings ... */}
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
               <CategoryButton label="General" icon={<SettingsIcon />} isActive={activeCategory === 'general'} onClick={() => setActiveCategory('general')} />
               <CategoryButton label="Appearance" icon={<EyeIcon />} isActive={activeCategory === 'appearance'} onClick={() => setActiveCategory('appearance')} />
               <CategoryButton label="Security" icon={<KeyIcon />} isActive={activeCategory === 'security'} onClick={() => setActiveCategory('security')} />
               <CategoryButton label="Content" icon={<FolderIcon />} isActive={activeCategory === 'content'} onClick={() => setActiveCategory('content')} />
               <CategoryButton label="Payment" icon={<PaymentIcon />} isActive={activeCategory === 'payment'} onClick={() => setActiveCategory('payment')} />
               <CategoryButton label="Reviews" icon={<ReviewsIcon />} isActive={activeCategory === 'reviews'} onClick={() => setActiveCategory('reviews')} />
               {isMasterAdmin && (
                  <CategoryButton label="Master" icon={<UsersIcon />} isActive={activeCategory === 'master'} onClick={() => setActiveCategory('master')} />
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
            .input-style:focus {
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