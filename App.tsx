

import React, { useState, useCallback, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TemplateSelection from './components/TemplateSelection';
import CaptureScreen from './components/CaptureScreen';
import PreviewScreen from './components/PreviewScreen';
import EditTemplateScreen from './components/EditTemplateScreen';
import LoginModal from './components/LoginModal';
import SettingsScreen from './components/SettingsScreen';
import TemplateMetadataModal from './components/TemplateMetadataModal';
import EventSelectionScreen from './components/EventSelectionScreen';
import ManageEventsScreen from './components/ManageEventsScreen';
import RenameEventModal from './components/RenameEventModal';
import AssignTemplatesModal from './components/AssignTemplatesModal';
import EventQrCodeModal from './components/EventQrCodeModal';
import HistoryScreen from './components/HistoryScreen';
import OnlineHistoryScreen from './components/OnlineHistoryScreen';
import AddOnlineHistoryModal from './components/AddOnlineHistoryModal';
import PinInputModal from './components/PinInputModal';
import KeyCodeScreen from './components/KeyCodeScreen';
import ManageSessionsScreen from './components/ManageSessionsScreen';
import ClosedScreen from './components/ClosedScreen';
import { AppState, PhotoSlot, Settings, Template, Event, HistoryEntry, SessionKey, OnlineHistoryEntry } from './types';
import { db, ref, onValue, off, set, push, update, remove, firebaseObjectToArray, query, orderByChild, equalTo, get } from './firebase';
import { getAllHistoryEntries, addHistoryEntry, deleteHistoryEntry, cacheImage } from './utils/db';
import { FullscreenIcon } from './components/icons/FullscreenIcon';
import useFullscreenLock from './hooks/useFullscreenLock';


const INITIAL_PHOTO_SLOTS: PhotoSlot[] = [
  { id: 1, inputId: 1, x: 90,  y: 70,   width: 480, height: 480 },
  { id: 2, inputId: 1, x: 630, y: 70,   width: 480, height: 480 },
  { id: 3, inputId: 2, x: 90,  y: 610,  width: 480, height: 480 },
  { id: 4, inputId: 2, x: 630, y: 610,  width: 480, height: 480 },
  { id: 5, inputId: 3, x: 90,  y: 1150, width: 480, height: 480 },
  { id: 6, inputId: 3, x: 630, y: 1150, width: 480, height: 480 },
];

const DEFAULT_SETTINGS: Settings = {
  countdownDuration: 5,
  flashEffectEnabled: true,
  isPinLockEnabled: false,
  fullscreenPin: '1234',
  isStrictKioskMode: false,
  isSessionCodeEnabled: true,
  freePlayMaxTakes: 1,
  theme: 'dark',
  welcomeTitle: 'SANS PHOTO',
  welcomeSubtitle: 'Your personal web photobooth',
  isDownloadButtonEnabled: true,
  isAutoDownloadEnabled: true,
  welcomeTitleColor: '',
  welcomeSubtitleColor: '',
  welcomeBgType: 'default',
  welcomeBgColor: '#111827',
  welcomeBgImageUrl: '',
  welcomeBgZoom: 100,
  isWelcomeTextShadowEnabled: true,
  welcomeTitleFont: "'Bebas Neue', sans-serif",
  welcomeSubtitleFont: "'Poppins', sans-serif",
  isWelcomeTitleFontRandom: false,
  isWelcomeSubtitleFontRandom: false,
  startButtonText: 'START SESSION',
  startButtonBgColor: '',
  startButtonTextColor: '',
  isStartButtonShadowEnabled: true,
  // New Print Settings Defaults
  isPrintButtonEnabled: true,
  printPaperSize: '4x6',
  printColorMode: 'color',
  isPrintCopyInputEnabled: true,
  printMaxCopies: 5,
  // Closed Mode Defaults
  isClosedModeEnabled: false,
  reopenTimestamp: 0,
  // Online History
  isOnlineHistoryEnabled: false,
  // New Online History Button Defaults
  isOnlineHistoryButtonIconEnabled: true,
  onlineHistoryButtonText: 'History',
  isOnlineHistoryButtonFillEnabled: false, // Default to outline button
  onlineHistoryButtonFillColor: '', // Use CSS variables by default
  onlineHistoryButtonTextColor: '', // Use CSS variables by default
  isOnlineHistoryButtonStrokeEnabled: true,
  onlineHistoryButtonStrokeColor: '', // Use CSS variables by default
  isOnlineHistoryButtonShadowEnabled: true,
};

const DEFAULT_TEMPLATE_DATA: Omit<Template, 'id'> = {
  name: 'Portrait 4x6',
  imageUrl: 'https://lh3.googleusercontent.com/pw/AP1GczMwGZ8j7Lessgx9F6qavNTLnoC1UodPtOLNCDQf7vMM_sFZdxkg-ADr8yLGa0aaFtaS_TAut_FQTfmgt3rwzaWL5cCEawjyp64oQMkJC3aZrd7fRXQ=w2400',
  widthMM: 102,
  heightMM: 152,
  orientation: 'portrait',
  photoSlots: INITIAL_PHOTO_SLOTS,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAddOnlineHistoryModalOpen, setIsAddOnlineHistoryModalOpen] = useState(false);
  const [isSavingOnlineHistory, setIsSavingOnlineHistory] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingEventQr, setEditingEventQr] = useState<Event | null>(null);
  const [assigningTemplatesEvent, setAssigningTemplatesEvent] = useState<Event | null>(null);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [onlineHistory, setOnlineHistory] = useState<OnlineHistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const [currentTakeCount, setCurrentTakeCount] = useState(0);

  const [isCaching, setIsCaching] = useState(false);
  const [cachingProgress, setCachingProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [keyCodeError, setKeyCodeError] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Activate strict kiosk mode based on settings
  useFullscreenLock(!!settings.isStrictKioskMode);

  // Fungsi untuk meng-cache semua gambar templat di latar belakang
  const cacheAllTemplates = useCallback(async (templatesToCache: Template[]) => {
      if (templatesToCache.length === 0) return;
      setIsCaching(true);
      setCachingProgress(0);

      for (let i = 0; i < templatesToCache.length; i++) {
          await cacheImage(templatesToCache[i].imageUrl);
          setCachingProgress(((i + 1) / templatesToCache.length) * 100);
      }

      // Beri sedikit jeda agar pengguna bisa melihat progress 100%
      setTimeout(() => {
          setIsCaching(false);
      }, 1500);
  }, []);

  useEffect(() => {
    // Load local history from IndexedDB on startup
    const loadHistory = async () => {
        const localHistory = await getAllHistoryEntries();
        setHistory(localHistory);
    };
    loadHistory();

    // Settings listener
    const settingsRef = ref(db, 'settings');
    const settingsListener = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snapshot.val() });
      } else {
        set(settingsRef, DEFAULT_SETTINGS);
      }
    });

    // Templates listener
    const templatesRef = ref(db, 'templates');
    const templatesListener = onValue(templatesRef, (snapshot) => {
        if (snapshot.exists()) {
            const fetchedTemplates = firebaseObjectToArray<Template>(snapshot.val());
            setTemplates(fetchedTemplates);
            // Mulai caching semua gambar templat setelah didapatkan
            cacheAllTemplates(fetchedTemplates);
        } else {
            push(templatesRef, DEFAULT_TEMPLATE_DATA);
        }
    });

    // Events listener
    const eventsRef = ref(db, 'events');
    const eventsListener = onValue(eventsRef, (snapshot) => {
        setEvents(firebaseObjectToArray<Event>(snapshot.val()));
    });
    
    // Session Keys listener
    const sessionKeysRef = ref(db, 'sessionKeys');
    const sessionKeysListener = onValue(sessionKeysRef, (snapshot) => {
        setSessionKeys(firebaseObjectToArray<SessionKey>(snapshot.val()));
    });
    
    // Online History listener
    const onlineHistoryRef = ref(db, 'onlineHistory');
    const onlineHistoryListener = onValue(onlineHistoryRef, (snapshot) => {
        const data = firebaseObjectToArray<OnlineHistoryEntry>(snapshot.val());
        setOnlineHistory(data.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => {
      off(settingsRef, 'value', settingsListener);
      off(templatesRef, 'value', templatesListener);
      off(eventsRef, 'value', eventsListener);
      off(sessionKeysRef, 'value', sessionKeysListener);
      off(onlineHistoryRef, 'value', onlineHistoryListener);
    };
  }, [cacheAllTemplates]);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [settings.theme]);
  
  // Handle responsive mode for online history
  useEffect(() => {
    const container = document.getElementById('app-container');
    if (container) {
      if (appState === AppState.ONLINE_HISTORY) {
        container.classList.add('responsive-mode');
      } else {
        container.classList.remove('responsive-mode');
      }
    }
  }, [appState]);

  // Real-time progress update
  useEffect(() => {
    if (!currentSessionKey) return;

    let progress = '';
    switch (appState) {
        case AppState.EVENT_SELECTION:
            progress = 'Memilih Event';
            break;
        case AppState.TEMPLATE_SELECTION:
            progress = 'Memilih Template';
            break;
        case AppState.PREVIEW:
            progress = 'Melihat Pratinjau Foto';
            break;
        // The CAPTURE state is handled by handleCaptureProgressUpdate
    }

    if (progress) {
        update(ref(db, `sessionKeys/${currentSessionKey.id}`), { progress });
    }
  }, [appState, currentSessionKey]);
  
  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    if (!document.fullscreenElement) {
      appContainer.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else if (!settings.isStrictKioskMode) {
      if (settings.isPinLockEnabled) {
          setIsPinModalOpen(true);
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [settings.isPinLockEnabled, settings.isStrictKioskMode]);

  const handleCorrectPin = useCallback(() => {
    setIsPinModalOpen(false);
    if (document.exitFullscreen && !settings.isStrictKioskMode) {
        document.exitFullscreen();
    }
  }, [settings.isStrictKioskMode]);

  const handleStartSession = useCallback(async () => {
    setKeyCodeError(null);
    if (settings.isSessionCodeEnabled) {
      setAppState(AppState.KEY_CODE_ENTRY);
    } else {
      // Mode "Free Play": Buat kunci sesi sementara dan mulai
      setIsSessionLoading(true);
      try {
        const newKeyData: Omit<SessionKey, 'id'> = {
          code: 'FREEPLAY',
          maxTakes: settings.freePlayMaxTakes || 1,
          takesUsed: 1,
          status: 'in_progress',
          createdAt: Date.now(),
          progress: 'Memilih Event', // Langsung set progress awal
        };
        const newKeyRef = await push(ref(db, 'sessionKeys'), newKeyData);
        if (!newKeyRef.key) {
          throw new Error("Could not get new session key from Firebase.");
        }
        
        const newKey: SessionKey = { id: newKeyRef.key, ...newKeyData };
        setCurrentSessionKey(newKey);
        setCurrentTakeCount(1);
        setAppState(AppState.EVENT_SELECTION);

      } catch (error) {
        console.error("Error starting free play session:", error);
        setKeyCodeError("Could not start a free session. Please check connection and try again.");
        setAppState(AppState.WELCOME); // Kembali ke welcome screen jika gagal
      } finally {
        setIsSessionLoading(false);
      }
    }
  }, [settings.isSessionCodeEnabled, settings.freePlayMaxTakes]);

  const handleKeyCodeSubmit = useCallback(async (code: string) => {
    setIsSessionLoading(true);
    setKeyCodeError(null);
    const codeUpper = code.toUpperCase();

    try {
        const sessionKeysRef = ref(db, 'sessionKeys');
        const q = query(sessionKeysRef, orderByChild('code'), equalTo(codeUpper));
        const snapshot = await get(q);

        if (!snapshot.exists()) {
            setKeyCodeError("Kode sesi tidak valid.");
            setIsSessionLoading(false);
            return;
        }

        const data = snapshot.val();
        const keyId = Object.keys(data)[0];
        const sessionKey: SessionKey = { id: keyId, ...data[keyId] };

        if (sessionKey.status !== 'available') {
            setKeyCodeError(`Kode ini telah ${sessionKey.status === 'completed' ? 'digunakan' : 'sedang berjalan'}.`);
            setIsSessionLoading(false);
            return;
        }

        // Kode valid, mulai sesi
        setCurrentSessionKey(sessionKey);
        setCurrentTakeCount(1);
        
        // Perbarui status di Firebase
        await update(ref(db, `sessionKeys/${sessionKey.id}`), { 
            status: 'in_progress',
            takesUsed: 1,
        });

        setAppState(AppState.EVENT_SELECTION);

    } catch (error) {
        console.error("Error validating session key:", error);
        setKeyCodeError("Terjadi kesalahan. Coba lagi.");
    } finally {
        setIsSessionLoading(false);
    }
  }, []);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    const selectedEvent = events.find(e => e.id === eventId);
    if (currentSessionKey && selectedEvent) {
        update(ref(db, `sessionKeys/${currentSessionKey.id}`), {
            currentEventName: selectedEvent.name,
        });
    }
    setAppState(AppState.TEMPLATE_SELECTION);
  }, [events, currentSessionKey]);

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setCapturedImages([]);
    
    if (currentSessionKey) {
        const totalPhotos = [...new Set(template.photoSlots.map(slot => slot.inputId))].length;
        update(ref(db, `sessionKeys/${currentSessionKey.id}`), {
            progress: `Sesi Foto (1/${totalPhotos})`,
        });
    }

    setAppState(AppState.CAPTURE);
  }, [currentSessionKey]);
  
  const handleManageTemplates = useCallback(() => {
    setAppState(AppState.SETTINGS); // Kembali ke settings dulu
    setTimeout(() => setAppState(AppState.TEMPLATE_SELECTION), 0); // Buka manage templates
  }, []);


  const handleManageEvents = useCallback(() => {
    setAppState(AppState.MANAGE_EVENTS);
  }, []);

  const handleManageSessions = useCallback(() => {
    setAppState(AppState.MANAGE_SESSIONS);
  }, []);

  const handleGoToSettings = useCallback(() => {
    setAppState(AppState.SETTINGS);
  }, []);
  
  const handleViewHistory = useCallback(() => {
      if (isAdminLoggedIn) {
          setAppState(AppState.HISTORY);
      }
  }, [isAdminLoggedIn]);
  
  const handleViewOnlineHistory = useCallback(() => {
    setAppState(AppState.ONLINE_HISTORY);
  }, []);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    set(ref(db, 'settings'), newSettings);
  }, []);

  const handleStartAddTemplate = useCallback(() => {
    setEditingTemplate({
      id: `template-${Date.now()}`,
      name: 'New Template',
      imageUrl: '',
      widthMM: 102,
      heightMM: 152,
      orientation: 'portrait',
      photoSlots: [...INITIAL_PHOTO_SLOTS]
    });
    setAppState(AppState.EDIT_TEMPLATE_METADATA);
  }, []);
  
  const handleStartEditTemplateMetadata = useCallback((template: Template) => {
    setEditingTemplate(template);
    setAppState(AppState.EDIT_TEMPLATE_METADATA);
  }, []);

  const handleSaveTemplateMetadata = useCallback((templateToSave: Template) => {
    const isNew = templateToSave.id.startsWith('template-');
    const { id, ...dataToSave } = templateToSave;

    if (isNew) {
      push(ref(db, 'templates'), dataToSave);
    } else {
      update(ref(db, `templates/${id}`), dataToSave);
    }
    setEditingTemplate(null);
    setAppState(AppState.SETTINGS);
  }, []);
  
  const handleCancelEditTemplateMetadata = useCallback(() => {
    setEditingTemplate(null);
    setAppState(AppState.SETTINGS);
  }, []);
  
  const handleStartEditLayout = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setAppState(AppState.EDIT_TEMPLATE_LAYOUT);
  }, []);
  
  const handleTemplateLayoutSave = useCallback((newSlots: PhotoSlot[]) => {
    if (!selectedTemplate) return;
    update(ref(db, `templates/${selectedTemplate.id}`), { photoSlots: newSlots });
    setSelectedTemplate(null);
    setAppState(AppState.SETTINGS);
  }, [selectedTemplate]);
  
  const handleDeleteTemplate = useCallback((templateId: string) => {
    remove(ref(db, `templates/${templateId}`));
  }, []);

  const handleEditLayoutCancel = useCallback(() => {
    setSelectedTemplate(null);
    setAppState(AppState.SETTINGS);
  }, []);
  
  // Event Management Handlers
  const handleAddEvent = useCallback((name: string) => {
    const newEvent: Event = { id: '', name, isArchived: false, isQrCodeEnabled: false, qrCodeImageUrl: '' };
    const { id, ...dataToSave } = newEvent;
    push(ref(db, 'events'), dataToSave);
  }, []);

  const handleStartRenameEvent = useCallback((event: Event) => setEditingEvent(event), []);
  const handleCancelRenameEvent = useCallback(() => setEditingEvent(null), []);
  const handleSaveRenameEvent = useCallback((eventId: string, newName: string) => {
    update(ref(db, `events/${eventId}`), { name: newName });
    setEditingEvent(null);
  }, []);
  
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    
    const updates: Record<string, any> = {};
    templates.forEach(t => {
      if (t.eventId === eventId) {
        updates[`/templates/${t.id}/eventId`] = null;
      }
    });

    updates[`/events/${eventId}`] = null;
    await update(ref(db), updates);
  }, [templates]);
  
  const handleToggleArchiveEvent = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
        update(ref(db, `events/${eventId}`), { isArchived: !event.isArchived });
    }
  }, [events]);
  
  const handleStartAssigningTemplates = useCallback((event: Event) => setAssigningTemplatesEvent(event), []);
  const handleCancelAssigningTemplates = useCallback(() => setAssigningTemplatesEvent(null), []);
  const handleSaveTemplateAssignments = useCallback((eventId: string, assignedTemplateIds: string[]) => {
    const updates: Record<string, any> = {};
    templates.forEach(t => {
      if (assignedTemplateIds.includes(t.id)) {
        if (t.eventId !== eventId) {
          updates[`/templates/${t.id}/eventId`] = eventId;
        }
      } else if (t.eventId === eventId) {
        updates[`/templates/${t.id}/eventId`] = null;
      }
    });
    update(ref(db), updates);
    setAssigningTemplatesEvent(null);
  }, [templates]);

  // QR Code handlers
  const handleStartEditQrCode = useCallback((event: Event) => setEditingEventQr(event), []);
  const handleCancelEditQrCode = useCallback(() => setEditingEventQr(null), []);
  const handleSaveQrCodeSettings = useCallback((eventId: string, settings: { qrCodeImageUrl?: string, isQrCodeEnabled?: boolean}) => {
      update(ref(db, `events/${eventId}`), settings);
      setEditingEventQr(null);
  }, []);
  
  // Session Key Handlers
  const handleAddSessionKey = useCallback(async (maxTakes: number) => {
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let newCode = generateCode();
      // Pastikan kode unik, meskipun kemungkinannya kecil
      while (sessionKeys.some(key => key.code === newCode)) {
          newCode = generateCode();
      }

      const newKey: Omit<SessionKey, 'id'> = {
          code: newCode,
          maxTakes,
          takesUsed: 0,
          status: 'available',
          createdAt: Date.now()
      };
      await push(ref(db, 'sessionKeys'), newKey);
  }, [sessionKeys]);

  const handleDeleteSessionKey = useCallback(async (keyId: string) => {
      if (window.confirm("Are you sure you want to delete this session code?")) {
          await remove(ref(db, `sessionKeys/${keyId}`));
      }
  }, []);

  // History Handlers (Now using IndexedDB)
  const handleSaveHistoryFromSession = useCallback(async (imageDataUrl: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;
    
    const timestamp = Date.now();
    const newEntry: HistoryEntry = {
        id: String(timestamp), // Use timestamp as a unique ID for local storage
        eventId: event.id,
        eventName: event.name,
        imageDataUrl,
        timestamp: timestamp,
    };
    await addHistoryEntry(newEntry);
    setHistory(prev => [newEntry, ...prev].sort((a,b) => b.timestamp - a.timestamp));
  }, [events, selectedEventId]);

  const handleDeleteHistoryEntry = useCallback(async (entryId: string) => {
      if (!window.confirm("Are you sure you want to delete this history entry?")) return;
      await deleteHistoryEntry(entryId);
      setHistory(prev => prev.filter(entry => entry.id !== entryId));
  }, []);
  
  // Online History Handlers
  const handleAddOnlineHistory = useCallback(async (urls: string[]) => {
    setIsSavingOnlineHistory(true);
    try {
        const historyRef = ref(db, 'onlineHistory');
        for (const url of urls) {
            const newEntry: Omit<OnlineHistoryEntry, 'id'> = {
                googlePhotosUrl: url,
                timestamp: Date.now(),
            };
            await push(historyRef, newEntry);
        }
    } catch (error) {
        console.error("Error adding to online history:", error);
        alert("Failed to add photos to online history. Please check the console for errors.");
    } finally {
        setIsSavingOnlineHistory(false);
        setIsAddOnlineHistoryModalOpen(false);
    }
  }, []);

  const handleDeleteOnlineHistoryEntry = useCallback(async (entryId: string) => {
    await remove(ref(db, `onlineHistory/${entryId}`));
  }, []);

  const handleBack = useCallback(() => {
    switch (appState) {
        case AppState.PREVIEW:
            setCapturedImages([]);
            setSelectedTemplate(null);
            setAppState(AppState.TEMPLATE_SELECTION);
            break;
        case AppState.TEMPLATE_SELECTION:
            setSelectedEventId(null);
            setAppState(AppState.EVENT_SELECTION);
            break;
        case AppState.EVENT_SELECTION:
            // Tidak bisa kembali ke input kode, harus membatalkan sesi
            handleCancelSession();
            break;
        case AppState.KEY_CODE_ENTRY:
        case AppState.SETTINGS:
        case AppState.HISTORY:
        case AppState.ONLINE_HISTORY:
            setAppState(AppState.WELCOME);
            break;
        case AppState.MANAGE_EVENTS:
        case AppState.MANAGE_SESSIONS:
            setAppState(AppState.SETTINGS);
            break;
        default:
            setAppState(AppState.WELCOME);
    }
  }, [appState]);

  const handleOpenLoginModal = useCallback(() => { setIsLoginModalOpen(true); }, []);
  const handleCloseLoginModal = useCallback(() => { setIsLoginModalOpen(false); }, []);
  const handleAdminLogin = useCallback(() => { setIsAdminLoggedIn(true); setIsLoginModalOpen(false); }, []);
  const handleAdminLogout = useCallback(() => { setIsAdminLoggedIn(false); }, []);

  const handleCaptureComplete = useCallback((images: string[]) => {
    setCapturedImages(images);
    setAppState(AppState.PREVIEW);
  }, []);
  
  const handleSessionEnd = useCallback(() => {
    if (currentSessionKey && currentSessionKey.status !== 'completed') {
        const updates: any = { 
            status: 'completed',
            progress: null,
            currentEventName: null,
        };
        // Hapus sesi "free play" setelah selesai untuk menjaga kebersihan database
        if (currentSessionKey.code === 'FREEPLAY') {
            remove(ref(db, `sessionKeys/${currentSessionKey.id}`));
        } else {
            update(ref(db, `sessionKeys/${currentSessionKey.id}`), updates);
        }
    }
    setCapturedImages([]);
    setSelectedTemplate(null);
    setSelectedEventId(null);
    setCurrentSessionKey(null);
    setCurrentTakeCount(0);
    setAppState(AppState.WELCOME);
  }, [currentSessionKey]);

  const handleStartNextTake = useCallback(() => {
      if (!currentSessionKey || currentTakeCount >= currentSessionKey.maxTakes) return;

      const nextTake = currentTakeCount + 1;
      setCurrentTakeCount(nextTake);
      update(ref(db, `sessionKeys/${currentSessionKey.id}`), { takesUsed: nextTake });

      // Reset untuk pengambilan berikutnya
      setCapturedImages([]);
      setSelectedTemplate(null);
      // Kembali ke pemilihan template, acara tetap sama
      setAppState(AppState.TEMPLATE_SELECTION);
  }, [currentSessionKey, currentTakeCount]);

  const handleCancelSession = useCallback(() => {
      if (currentSessionKey) {
          if (currentSessionKey.code === 'FREEPLAY') {
              // Hapus sesi "free play" jika dibatalkan
              remove(ref(db, `sessionKeys/${currentSessionKey.id}`));
          } else {
              // Kembalikan status ke 'available' jika belum ada foto yang diambil
              update(ref(db, `sessionKeys/${currentSessionKey.id}`), { 
                  status: 'available', 
                  takesUsed: 0,
                  progress: null,
                  currentEventName: null,
              });
          }
      }
      setCurrentSessionKey(null);
      setCurrentTakeCount(0);
      setSelectedEventId(null);
      setAppState(AppState.WELCOME);
  }, [currentSessionKey]);

  const handleCaptureProgressUpdate = useCallback((current: number, total: number) => {
    if (currentSessionKey) {
        update(ref(db, `sessionKeys/${currentSessionKey.id}`), {
            progress: `Sesi Foto (${current}/${total})`,
        });
    }
  }, [currentSessionKey]);

  const renderContent = () => {
    const selectedEvent = events.find(e => e.id === selectedEventId) || null;
    
    // Logika Mode Tutup
    const isAppClosed = settings.isClosedModeEnabled && 
                        settings.reopenTimestamp && 
                        Date.now() < settings.reopenTimestamp;

    if (isAppClosed && !isAdminLoggedIn) {
        return <ClosedScreen 
            reopenTimestamp={settings.reopenTimestamp || 0} 
            onAdminLoginClick={handleOpenLoginModal}
        />;
    }
      
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen 
            onStart={handleStartSession} 
            onSettingsClick={handleGoToSettings} 
            onViewHistory={handleViewHistory}
            onViewOnlineHistory={handleViewOnlineHistory}
            isAdminLoggedIn={isAdminLoggedIn} 
            isCaching={isCaching} 
            cachingProgress={cachingProgress}
            onAdminLoginClick={handleOpenLoginModal}
            onAdminLogoutClick={handleAdminLogout}
            isLoading={isSessionLoading}
            settings={settings}
        />;
      
      case AppState.KEY_CODE_ENTRY:
        return <KeyCodeScreen onKeyCodeSubmit={handleKeyCodeSubmit} onBack={handleBack} error={keyCodeError} isLoading={isSessionLoading} />;

      case AppState.EVENT_SELECTION:
        return <EventSelectionScreen events={events.filter(e => !e.isArchived)} onSelect={handleEventSelect} onBack={handleBack} />;

      case AppState.TEMPLATE_SELECTION:
        return <TemplateSelection 
          templates={templates.filter(t => isAdminLoggedIn ? true : t.eventId === selectedEventId)}
          onSelect={handleTemplateSelect} 
          onBack={handleBack} 
          isAdminLoggedIn={isAdminLoggedIn}
          onAddTemplate={handleStartAddTemplate}
          onEditMetadata={handleStartEditTemplateMetadata}
          onEditLayout={handleStartEditLayout}
          onDelete={handleDeleteTemplate}
        />;
      
      case AppState.SETTINGS:
        return <SettingsScreen settings={settings} onSettingsChange={handleSettingsChange} onManageTemplates={handleManageTemplates} onManageEvents={handleManageEvents} onManageSessions={handleManageSessions} onViewHistory={handleViewHistory} onBack={handleBack} />;
      
      case AppState.MANAGE_EVENTS:
         return <ManageEventsScreen 
            events={events}
            onBack={handleBack}
            onAddEvent={handleAddEvent}
            onRenameEvent={handleStartRenameEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleArchive={handleToggleArchiveEvent}
            onAssignTemplates={handleStartAssigningTemplates}
            onQrCodeSettings={handleStartEditQrCode}
         />;
         
      case AppState.MANAGE_SESSIONS:
          if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; }
          return <ManageSessionsScreen 
            sessionKeys={sessionKeys} 
            onBack={handleBack} 
            onAddKey={handleAddSessionKey} 
            onDeleteKey={handleDeleteSessionKey}
          />;

      case AppState.HISTORY:
          // FIX: Changed WELCOME to AppState.WELCOME to correctly reference the enum member.
          if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; }
          return <HistoryScreen history={history} events={events} onDelete={handleDeleteHistoryEntry} onBack={handleBack} />;
      
      case AppState.ONLINE_HISTORY:
          return <OnlineHistoryScreen
            history={onlineHistory}
            isAdminLoggedIn={isAdminLoggedIn}
            onBack={handleBack}
            onAdd={() => setIsAddOnlineHistoryModalOpen(true)}
            onDelete={handleDeleteOnlineHistoryEntry}
          />;

      case AppState.EDIT_TEMPLATE_METADATA:
        if (!isAdminLoggedIn || !editingTemplate) { setAppState(AppState.WELCOME); return null; }
        return <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />;
      
      case AppState.EDIT_TEMPLATE_LAYOUT:
        if (!isAdminLoggedIn || !selectedTemplate) { setAppState(AppState.WELCOME); return null; }
        return <EditTemplateScreen template={selectedTemplate} onSave={handleTemplateLayoutSave} onCancel={handleEditLayoutCancel} />;
      
      case AppState.CAPTURE:
        if (!selectedTemplate) { setAppState(AppState.WELCOME); return null; }
        return <CaptureScreen 
            onComplete={handleCaptureComplete} 
            template={selectedTemplate} 
            countdownDuration={settings.countdownDuration} 
            flashEffectEnabled={settings.flashEffectEnabled}
            onProgressUpdate={handleCaptureProgressUpdate}
        />;
      
      case AppState.PREVIEW:
        if (!selectedTemplate || !currentSessionKey) { setAppState(AppState.WELCOME); return null; }
        return <PreviewScreen 
            images={capturedImages} 
            onRestart={handleSessionEnd} 
            onBack={handleBack} 
            template={selectedTemplate} 
            onSaveHistory={handleSaveHistoryFromSession} 
            event={selectedEvent}
            currentTake={currentTakeCount}
            maxTakes={currentSessionKey.maxTakes}
            onNextTake={handleStartNextTake}
            isDownloadButtonEnabled={settings.isDownloadButtonEnabled ?? true}
            isAutoDownloadEnabled={settings.isAutoDownloadEnabled ?? true}
            printSettings={{
              isEnabled: settings.isPrintButtonEnabled ?? true,
              paperSize: settings.printPaperSize ?? '4x6',
              colorMode: settings.printColorMode ?? 'color',
              isCopyInputEnabled: settings.isPrintCopyInputEnabled ?? true,
              maxCopies: settings.printMaxCopies ?? 5,
            }}
        />;
      
      default:
        return <WelcomeScreen 
            onStart={handleStartSession} 
            onSettingsClick={handleGoToSettings} 
            onViewHistory={handleViewHistory}
            onViewOnlineHistory={handleViewOnlineHistory}
            isAdminLoggedIn={isAdminLoggedIn} 
            isCaching={isCaching} 
            cachingProgress={cachingProgress}
            onAdminLoginClick={handleOpenLoginModal}
            onAdminLogoutClick={handleAdminLogout}
            isLoading={isSessionLoading}
            settings={settings}
        />;
    }
  };

  return (
    <div className="h-full bg-[var(--color-bg-primary)] flex flex-col items-center justify-center text-[var(--color-text-primary)] relative">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={toggleFullscreen}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          <FullscreenIcon isFullscreen={isFullscreen} />
        </button>
      </div>
      
      {isLoginModalOpen && <LoginModal onLogin={handleAdminLogin} onClose={handleCloseLoginModal} />}
      {isPinModalOpen && (
        <PinInputModal 
            correctPin={settings.fullscreenPin || '1234'}
            onCorrectPin={handleCorrectPin}
            onClose={() => setIsPinModalOpen(false)}
        />
      )}
      {editingEvent && <RenameEventModal event={editingEvent} onSave={handleSaveRenameEvent} onClose={handleCancelRenameEvent} />}
      {assigningTemplatesEvent && <AssignTemplatesModal event={assigningTemplatesEvent} allTemplates={templates} onSave={handleSaveTemplateAssignments} onClose={handleCancelAssigningTemplates} />}
      {editingEventQr && <EventQrCodeModal event={editingEventQr} onSave={handleSaveQrCodeSettings} onClose={handleCancelEditQrCode} />}
      {isAddOnlineHistoryModalOpen && (
        <AddOnlineHistoryModal 
            onClose={() => setIsAddOnlineHistoryModalOpen(false)}
            onSave={handleAddOnlineHistory}
            isSaving={isSavingOnlineHistory}
        />
      )}
      {appState === AppState.EDIT_TEMPLATE_METADATA && editingTemplate && (
         <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />
      )}
      
      <main className="w-full h-full p-4 flex flex-col items-center justify-center">
        {keyCodeError && appState === AppState.WELCOME && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800/90 p-4 rounded-lg z-50 text-center border border-red-600 text-white">
            <p className="font-bold">Error</p>
            <p>{keyCodeError}</p>
            <button onClick={() => setKeyCodeError(null)} className="mt-2 text-sm text-gray-200 underline">Dismiss</button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;