
import React, { useState } from 'react';
import { Settings, PaymentEntry, OnlineHistoryEntry, PriceList } from '../types';
import { BackIcon } from './icons/BackIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { AddIcon } from './icons/AddIcon';

export const GOOGLE_FONTS = [
  { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Lora', value: "'Lora', serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Oswald', value: "'Oswald', sans-serif" },
  { name: 'Raleway', value: "'Raleway', sans-serif" },
];

const SCRIPT_URL_GET_HISTORY = 'https://script.google.com/macros/s/AKfycbwbnlO9vk95yTKeHFFilhJbfFcjibH80sFzsA5II3BAkuNudCTabRNdBUhYlCEHHO5CYQ/exec';

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
  payments: PaymentEntry[];
  onDeletePayment: (id: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSettingsChange,
  onManageTemplates,
  onManageEvents,
  onManageSessions,
  onManageReviews,
  onViewHistory,
  onBack,
  isMasterAdmin,
  onManageTenants,
  payments,
  onDeletePayment
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'camera' | 'session' | 'management' | 'payments'>('general');
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null);

  // Helper to update settings
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      updateSetting(name as keyof Settings, Number(value));
    } else {
      updateSetting(name as keyof Settings, value);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateSetting(name as keyof Settings, checked);
  };

  // Price List Management
  const handleAddPrice = () => {
      const newPrice: PriceList = {
          id: Date.now().toString(),
          name: 'New Package',
          description: 'Description here',
          price: 50000,
          maxTakes: 1
      };
      const currentList = settings.priceLists || [];
      updateSetting('priceLists', [...currentList, newPrice]);
  };

  const handleUpdatePrice = (index: number, field: keyof PriceList, value: any) => {
      const currentList = [...(settings.priceLists || [])];
      currentList[index] = { ...currentList[index], [field]: value };
      updateSetting('priceLists', currentList);
  };

  const handleDeletePrice = (index: number) => {
      const currentList = [...(settings.priceLists || [])];
      currentList.splice(index, 1);
      updateSetting('priceLists', currentList);
  };

  // WhatsApp Logic
  const handleSendWhatsapp = async (payment: PaymentEntry) => {
      if (sendingWhatsappId) return;
      if (!payment.whatsappNumber) {
          alert("No WhatsApp number provided for this payment.");
          return;
      }
      setSendingWhatsappId(payment.id);

      const phone = payment.whatsappNumber;
      const name = payment.userName;

      // 1. Clean number (remove non-digits)
      let cleanNumber = phone.replace(/\D/g, '');
      
      // 2. Format to international 62
      if (cleanNumber.startsWith('0')) {
          cleanNumber = '62' + cleanNumber.substring(1);
      }

      // Default message
      let message = `Halo Kak ${name}, Terima kasih sudah menggunakan jasa photoboth dari Sans Photobooth! 📸✨\n\nIni softfile foto kakak ya. Ditunggu kedatangannya kembali! 🥰`;

      try {
          const safeUserName = name.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
          
          // Fetch data from Apps Script
          const response = await fetch(SCRIPT_URL_GET_HISTORY);
          if (response.ok) {
              const data: OnlineHistoryEntry[] = await response.json();
              // Find matching photo (check name)
              const matchedPhoto = data.find(item => item.nama.includes(safeUserName));
              
              if (matchedPhoto) {
                  message += `\n\n📂 *Link Foto HD:*\nSupaya hasilnya makin jernih, kakak bisa download file aslinya di link ini ya:\n${matchedPhoto.url}`;
                  message += `\n\nTerima kasih! 🥰`;

                  // Fetch image blob via proxy for clipboard
                  try {
                      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(matchedPhoto.url)}`;
                      const imgResponse = await fetch(proxiedUrl);
                      const blob = await imgResponse.blob();
                      
                      // Write to clipboard
                      await navigator.clipboard.write([
                          new ClipboardItem({
                              [blob.type]: blob
                          })
                      ]);
                      
                      alert(`Foto "${matchedPhoto.nama}" berhasil disalin ke Clipboard! 📋\n\nLink Google Drive juga sudah ditambahkan ke pesan.\n\nKlik OK untuk membuka WhatsApp, lalu tekan 'Ctrl + V' (Paste) di kolom chat.`);
                  } catch (clipErr) {
                      console.error("Clipboard copy failed", clipErr);
                      alert("Gagal menyalin foto ke clipboard, namun link akan tetap dikirim.");
                  }
              } else {
                  console.log("Photo not found in cloud yet, opening chat text only.");
              }
          }
      } catch (e) {
          console.error("Failed to process Whatsapp automation", e);
      } finally {
          setSendingWhatsappId(null);
          // 4. Encode URL and Open WhatsApp
          const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      }
  };

  return (
    <div className="relative flex flex-col w-full h-full">
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
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Settings</h2>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap px-4">
          {['general', 'camera', 'session', 'management', 'payments'].map(tab => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-full font-bold capitalize transition-colors ${activeTab === tab ? 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)]' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      <main className="w-full max-w-4xl mx-auto flex-grow overflow-y-auto scrollbar-thin px-4 pb-8">
          
          {/* General Tab */}
          {activeTab === 'general' && (
              <div className="space-y-6">
                  <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
                      <h3 className="text-2xl font-bebas mb-4 text-[var(--color-text-accent)]">Welcome Screen</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold mb-1">Title</label>
                              <input type="text" name="welcomeTitle" value={settings.welcomeTitle || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Subtitle</label>
                              <input type="text" name="welcomeSubtitle" value={settings.welcomeSubtitle || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Start Button Text</label>
                              <input type="text" name="startButtonText" value={settings.startButtonText || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Theme</label>
                              <select name="theme" value={settings.theme || 'dark'} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded">
                                  <option value="dark">Dark</option>
                                  <option value="light">Light</option>
                              </select>
                          </div>
                      </div>
                      
                      <div className="mt-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="isWelcomeTextShadowEnabled" checked={settings.isWelcomeTextShadowEnabled ?? true} onChange={handleCheckboxChange} />
                              <span>Enable Text Shadow</span>
                          </label>
                      </div>
                  </div>
              </div>
          )}

          {/* Camera Tab */}
          {activeTab === 'camera' && (
              <div className="space-y-6">
                  <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
                      <h3 className="text-2xl font-bebas mb-4 text-[var(--color-text-accent)]">Camera Config</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold mb-1">Source Type</label>
                              <select name="cameraSourceType" value={settings.cameraSourceType || 'default'} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded">
                                  <option value="default">Default Webcam</option>
                                  <option value="ip_camera">IP Camera</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Device ID (Optional)</label>
                              <input type="text" name="cameraDeviceId" value={settings.cameraDeviceId || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" placeholder="Webcam Device ID" />
                          </div>
                          {settings.cameraSourceType === 'ip_camera' && (
                              <div className="col-span-2">
                                  <label className="block text-sm font-bold mb-1">IP Camera URL</label>
                                  <input type="text" name="ipCameraUrl" value={settings.ipCameraUrl || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" placeholder="http://192.168.x.x/video" />
                                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                                      <input type="checkbox" name="ipCameraUseProxy" checked={settings.ipCameraUseProxy || false} onChange={handleCheckboxChange} />
                                      <span>Use CORS Proxy</span>
                                  </label>
                              </div>
                          )}
                          <div>
                              <label className="block text-sm font-bold mb-1">Countdown (sec)</label>
                              <input type="number" name="countdownDuration" value={settings.countdownDuration} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1">Max Retakes</label>
                              <input type="number" name="maxRetakes" value={settings.maxRetakes ?? 0} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" />
                          </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="flashEffectEnabled" checked={settings.flashEffectEnabled} onChange={handleCheckboxChange} />
                              <span>Flash Effect</span>
                          </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="isPrintButtonEnabled" checked={settings.isPrintButtonEnabled ?? true} onChange={handleCheckboxChange} />
                              <span>Enable Print Button</span>
                          </label>
                      </div>
                  </div>
              </div>
          )}

          {/* Session Tab */}
          {activeTab === 'session' && (
               <div className="space-y-6">
                  <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
                      <h3 className="text-2xl font-bebas mb-4 text-[var(--color-text-accent)]">Access Control</h3>
                      <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="isSessionCodeEnabled" checked={settings.isSessionCodeEnabled ?? true} onChange={handleCheckboxChange} />
                              <span>Enable Session Codes / Tickets</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="isPaymentEnabled" checked={settings.isPaymentEnabled || false} onChange={handleCheckboxChange} />
                              <span>Enable Payment Mode (QRIS)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name="isStrictKioskMode" checked={settings.isStrictKioskMode || false} onChange={handleCheckboxChange} />
                              <span>Strict Kiosk Mode (Lock Fullscreen)</span>
                          </label>
                          <div>
                              <label className="block text-sm font-bold mb-1">Admin/Exit PIN</label>
                              <input type="text" name="fullscreenPin" value={settings.fullscreenPin || '1234'} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded max-w-xs" />
                          </div>
                      </div>
                  </div>

                  {settings.isPaymentEnabled && (
                      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
                          <h3 className="text-2xl font-bebas mb-4 text-[var(--color-text-accent)]">Price Packages</h3>
                          <div className="mb-4">
                              <label className="block text-sm font-bold mb-1">QRIS Image URL</label>
                              <input type="text" name="qrisImageUrl" value={settings.qrisImageUrl || ''} onChange={handleInputChange} className="w-full bg-[var(--color-bg-tertiary)] p-2 rounded" placeholder="URL to QRIS image" />
                          </div>
                          
                          <div className="space-y-4">
                              {(settings.priceLists || []).map((price, idx) => (
                                  <div key={price.id} className="bg-[var(--color-bg-primary)] p-4 rounded border border-[var(--color-border-secondary)] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                      <div className="md:col-span-1">
                                          <label className="text-xs">Name</label>
                                          <input type="text" value={price.name} onChange={(e) => handleUpdatePrice(idx, 'name', e.target.value)} className="w-full bg-[var(--color-bg-tertiary)] p-1 rounded text-sm" />
                                      </div>
                                      <div className="md:col-span-1">
                                          <label className="text-xs">Price</label>
                                          <input type="number" value={price.price} onChange={(e) => handleUpdatePrice(idx, 'price', Number(e.target.value))} className="w-full bg-[var(--color-bg-tertiary)] p-1 rounded text-sm" />
                                      </div>
                                      <div className="md:col-span-1">
                                          <label className="text-xs">Takes</label>
                                          <input type="number" value={price.maxTakes} onChange={(e) => handleUpdatePrice(idx, 'maxTakes', Number(e.target.value))} className="w-full bg-[var(--color-bg-tertiary)] p-1 rounded text-sm" />
                                      </div>
                                      <div className="md:col-span-1 flex justify-end">
                                          <button onClick={() => handleDeletePrice(idx)} className="text-red-400 p-2"><TrashIcon /></button>
                                      </div>
                                  </div>
                              ))}
                              <button onClick={handleAddPrice} className="flex items-center gap-2 text-green-400 font-bold hover:text-green-300">
                                  <AddIcon /> Add Package
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* Management Tab */}
          {activeTab === 'management' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={onManageTemplates} className="p-6 bg-[var(--color-accent-secondary)] rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                      Manage Templates
                  </button>
                  <button onClick={onManageEvents} className="p-6 bg-[var(--color-accent-primary)] rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                      Manage Events
                  </button>
                  <button onClick={onManageSessions} className="p-6 bg-[var(--color-info)] rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                      Manage Sessions
                  </button>
                  <button onClick={onManageReviews} className="p-6 bg-[var(--color-positive)] rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                      Manage Reviews
                  </button>
                  <button onClick={onViewHistory} className="p-6 bg-gray-600 rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                      Local History
                  </button>
                  {isMasterAdmin && (
                      <button onClick={onManageTenants} className="p-6 bg-red-600 rounded-lg font-bebas text-2xl hover:brightness-110 transition-all text-left">
                          Manage Admins
                      </button>
                  )}
              </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
              <div className="space-y-4">
                  <h3 className="text-2xl font-bebas mb-4 text-[var(--color-text-accent)]">Payment Log</h3>
                  {payments.length === 0 ? (
                      <p className="text-[var(--color-text-muted)]">No payments recorded yet.</p>
                  ) : (
                      payments.map((payment) => (
                          <div key={payment.id} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="text-left w-full sm:w-auto">
                                  <p className="font-bold text-lg">{payment.userName}</p>
                                  <p className="text-sm text-[var(--color-text-secondary)]">{payment.priceListName} - Rp {payment.amount.toLocaleString()}</p>
                                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(payment.timestamp).toLocaleString()}</p>
                                  <p className={`text-xs font-bold uppercase mt-1 ${payment.status === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>{payment.status}</p>
                                  {payment.whatsappNumber && <p className="text-xs text-[var(--color-text-muted)]">WA: {payment.whatsappNumber}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                  {payment.whatsappNumber && (
                                      <button 
                                          onClick={() => handleSendWhatsapp(payment)}
                                          disabled={sendingWhatsappId === payment.id}
                                          className="bg-[#25D366] hover:bg-[#20b858] text-white p-2 rounded-full disabled:opacity-50"
                                          title="Send WhatsApp"
                                      >
                                          <WhatsAppIcon />
                                      </button>
                                  )}
                                  <button onClick={() => onDeletePayment(payment.id)} className="bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-white p-2 rounded-full" title="Delete Log">
                                      <TrashIcon />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}

      </main>
    </div>
  );
};

export default SettingsScreen;
