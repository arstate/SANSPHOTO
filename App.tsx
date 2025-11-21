
import React, { useState, useCallback, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TemplateSelection from './components/TemplateSelection';
import CaptureScreen from './components/CaptureScreen';
import RetakePreviewScreen from './components/RetakePreviewScreen';
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
import PinInputModal from './components/PinInputModal';
import KeyCodeScreen from './components/KeyCodeScreen';
import ManageSessionsScreen from './components/ManageSessionsScreen';
import ClosedScreen from './components/ClosedScreen';
import RatingScreen from './components/RatingScreen';
import ManageReviewsScreen from './components/ManageReviewsScreen';
import ManageTenantsScreen from './components/ManageTenantsScreen';
import TenantLoginModal from './components/TenantLoginModal';
import TenantNotFoundScreen from './components/TenantNotFoundScreen';
import TenantEditModal from './components/TenantEditModal';

import { AppState, PhotoSlot, Settings, Template, Event, HistoryEntry, SessionKey, Review, Tenant } from './types';
import { db, ref, onValue, off, set, push, update, remove, firebaseObjectToArray, query, orderByChild, equalTo, get } from './firebase';
import { getAllHistoryEntries, addHistoryEntry, deleteHistoryEntry, getCachedImage, storeImageInCache } from './utils/db';
import { FullscreenIcon } from './components/icons/FullscreenIcon';
import useFullscreenLock from './hooks/useFullscreenLock';

// URL Google Apps Script untuk menangani unggahan
const SCRIPT_URL_RETAKE = 'https://script.google.com/macros/s/AKfycbwZY1besq9swP1LsqIlHAiekq5MAr4pJ_DAJtbPTDSD-U_hPngd4tztkYJtnAHdVT0J9w/exec';

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
  cameraSourceType: 'default',
  ipCameraUrl: '',
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
  isPrintButtonEnabled: true,
  printPaperSize: '4x6',
  printColorMode: 'color',
  isPrintCopyInputEnabled: true,
  printMaxCopies: 5,
  isClosedModeEnabled: false,
  reopenTimestamp: 0,
  isOnlineHistoryEnabled: false,
  isOnlineHistoryButtonIconEnabled: true,
  onlineHistoryButtonText: 'History',
  isOnlineHistoryButtonFillEnabled: false,
  onlineHistoryButtonFillColor: '',
  onlineHistoryButtonTextColor: '',
  isOnlineHistoryButtonStrokeEnabled: true,
  onlineHistoryButtonStrokeColor: '',
  isOnlineHistoryButtonShadowEnabled: true,
  maxRetakes: 3,
  isReviewSliderEnabled: true,
  reviewSliderMaxDescriptionLength: 150,
  isReviewForFreebieEnabled: false,
  reviewFreebieTakesCount: 1,
  ratingScreenTitle: 'Bagaimana pengalaman Anda?',
  ratingScreenSubtitle: 'Ulasan Anda membantu kami menjadi lebih baik!',
  ratingScreenFreebieTitle: '⭐ PENAWARAN SPESIAL! ⭐',
  ratingScreenFreebieDescription: 'Berikan ulasan 5 bintang untuk mendapatkan {count} sesi foto tambahan gratis!',
  ratingScreenNameLabel: 'Nama Anda',
  ratingScreenNamePlaceholder: 'contoh: Budi',
  ratingScreenRatingLabel: 'Peringkat Anda',
  ratingScreenCommentLabel: 'Komentar',
  ratingScreenCommentPlaceholder: 'Ceritakan pendapat Anda...',
  ratingScreenSubmitButtonText: 'Kirim Ulasan',
  ratingScreenSkipButtonText: 'Lewati untuk sekarang',
};

const DEFAULT_TEMPLATE_DATA: Omit<Template, 'id'> = {
  name: 'Portrait 4x6',
  imageUrl: 'https://lh3.googleusercontent.com/pw/AP1GczMwGZ8j7Lessgx9F6qavNTLnoC1UodPtOLNCDQf7vMM_sFZdxkg-ADr8yLGa0aaFtaS_TAut_FQTfmgt3rwzaWL5cCEawjyp64oQMkJC3aZrd7fRXQ=w2400',
  widthMM: 102,
  heightMM: 152,
  orientation: 'portrait',
  photoSlots: INITIAL_PHOTO_SLOTS,
};

const GlobalUploadIndicator: React.FC<{ status: 'uploading' | 'success' | 'error', progress: number }> = ({ status, progress }) => {
    let message = '';
    let bgColor = '';

    switch (status) {
        case 'uploading':
            message = `Uploading to Gallery... ${Math.round(progress)}%`;
            bgColor = 'bg-[var(--color-info)]';
            break;
        case 'success':
            message = 'Upload successful!';
            bgColor = 'bg-[var(--color-positive)]';
            break;
        case 'error':
            message = 'Upload failed. Please check connection.';
            bgColor = 'bg-[var(--color-negative)]';
            break;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[var(--color-bg-secondary)]/90 backdrop-blur-sm z-50 transition-transform duration-300 transform translate-y-0">
            <div className="max-w-md mx-auto text-center">
                <p className="text-sm text-white mb-1">{message}</p>
                <div className="w-full bg-[var(--color-border-secondary)] rounded-full h-2">
                    <div
                        className={`${bgColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTenantLoginModalOpen, setIsTenantLoginModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingEventQr, setEditingEventQr] = useState<Event | null>(null);
  const [assigningTemplatesEvent, setAssigningTemplatesEvent] = useState<Event | null>(null);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const [currentTakeCount, setCurrentTakeCount] = useState(0);

  const [isCaching, setIsCaching] = useState(false);
  const [cachingProgress, setCachingProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [keyCodeError, setKeyCodeError] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{ id: number, progress: number; status: 'uploading' | 'success' | 'error' | 'idle' }>({ id: 0, progress: 0, status: 'idle' });
  
  const [retakesUsed, setRetakesUsed] = useState(0);
  const [retakingPhotoIndex, setRetakingPhotoIndex] = useState<number | null>(null);
  
  const cachingSessionRef = useRef(0);

  useFullscreenLock(!!settings.isStrictKioskMode);

  // Tenant detection from URL hash to fix SPA routing issues
  useEffect(() => {
    let allTenants: Tenant[] = [];
    const tenantsRef = ref(db, 'tenants');

    const checkPath = () => {
        const path = window.location.hash.slice(1).replace(/^\//, ''); // e.g., #/tenant -> tenant

        if (path === '') {
            setCurrentTenantId('master');
            setTenantNotFound(false);
        } else {
            const tenant = allTenants.find(t => t.path === path);
            if (tenant && tenant.isActive) {
                setCurrentTenantId(tenant.id);
                setTenantNotFound(false);
            } else {
                setCurrentTenantId(null);
                setTenantNotFound(true);
            }
        }
    };

    const onValueListener = onValue(tenantsRef, (snapshot) => {
        const fetchedTenants = firebaseObjectToArray<Tenant>(snapshot.val());
        setTenants(fetchedTenants);
        allTenants = fetchedTenants;
        checkPath(); // Re-check path when tenants data changes
    });

    window.addEventListener('hashchange', checkPath);
    checkPath(); // Initial check on load

    return () => {
        off(tenantsRef, 'value', onValueListener);
        window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  const cacheAllTemplates = useCallback(async (templatesToCache: Template[], sessionId: number) => {
    if (templatesToCache.length === 0) return;
    if (sessionId !== cachingSessionRef.current) return;

    setIsCaching(true);
    setCachingProgress(0);

    let templatesToProcess = [...templatesToCache];
    let totalSuccessCount = 0;
    const totalTemplates = templatesToCache.length;

    // Optimize by checking for already cached images first
    const cacheCheckPromises = templatesToProcess.map(t => getCachedImage(t.imageUrl));
    const initiallyCachedResults = await Promise.all(cacheCheckPromises);
    
    const templatesNeedingCache = templatesToProcess.filter((_, index) => !initiallyCachedResults[index]);
    totalSuccessCount = totalTemplates - templatesNeedingCache.length;
    templatesToProcess = templatesNeedingCache;

    if (totalTemplates > 0) {
        setCachingProgress((totalSuccessCount / totalTemplates) * 100);
    }

    // Loop until all templates that need caching are processed
    while (templatesToProcess.length > 0 && sessionId === cachingSessionRef.current) {
        const failedThisRound: Template[] = [];

        await Promise.all(templatesToProcess.map(async (template) => {
            if (!template.imageUrl) return;

            try {
                let fetchUrl = template.imageUrl;
                if (template.imageUrl.startsWith('http')) {
                    fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(template.imageUrl)}`;
                }
                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image ${template.imageUrl}: Status ${response.status}`);
                }
                const blob = await response.blob();
                if (!blob.type.startsWith('image/')) {
                  throw new Error(`Fetched content is not an image. Type: ${blob.type}`);
                }
                await storeImageInCache(template.imageUrl, blob);
                
                // Only increment and update progress on success
                totalSuccessCount++;
                if (sessionId === cachingSessionRef.current) {
                    setCachingProgress((totalSuccessCount / totalTemplates) * 100);
                }
            } catch (error) {
                console.error(`Failed to pre-cache image ${template.imageUrl}`, error);
                failedThisRound.push(template);
            }
        }));
        
        templatesToProcess = failedThisRound;

        if (templatesToProcess.length > 0 && sessionId === cachingSessionRef.current) {
            console.log(`Retrying ${templatesToProcess.length} failed templates in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Final check if session is still valid before hiding the caching UI
    if (sessionId === cachingSessionRef.current) {
        setTimeout(() => {
            if (sessionId === cachingSessionRef.current) {
                setIsCaching(false);
            }
        }, 1500);
    }
  }, []);

  useEffect(() => {
    if (!currentTenantId) return;

    cachingSessionRef.current += 1;
    const currentSessionId = cachingSessionRef.current;
    setIsCaching(false);

    const loadHistory = async () => {
        const localHistory = await getAllHistoryEntries();
        setHistory(localHistory);
    };
    loadHistory();

    const dataPath = `data/${currentTenantId}`;

    const settingsRef = ref(db, `${dataPath}/settings`);
    const templatesRef = ref(db, `${dataPath}/templates`);
    const eventsRef = ref(db, `${dataPath}/events`);
    const sessionKeysRef = ref(db, `${dataPath}/sessionKeys`);
    const reviewsRef = ref(db, `${dataPath}/reviews`);

    const settingsListener = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snapshot.val() });
      else set(settingsRef, DEFAULT_SETTINGS);
    });
    const templatesListener = onValue(templatesRef, (snapshot) => {
        if (snapshot.exists()) {
            const fetchedTemplates = firebaseObjectToArray<Template>(snapshot.val());
            setTemplates(fetchedTemplates);
            cacheAllTemplates(fetchedTemplates, currentSessionId);
        } else if (currentTenantId === 'master') {
            push(templatesRef, DEFAULT_TEMPLATE_DATA);
        } else {
            setTemplates([]);
        }
    });
    const eventsListener = onValue(eventsRef, (snapshot) => setEvents(firebaseObjectToArray<Event>(snapshot.val())));
    const sessionKeysListener = onValue(sessionKeysRef, (snapshot) => setSessionKeys(firebaseObjectToArray<SessionKey>(snapshot.val())));
    const reviewsListener = onValue(reviewsRef, (snapshot) => setReviews(firebaseObjectToArray<Review>(snapshot.val()).sort((a, b) => b.timestamp - a.timestamp)));

    return () => {
      off(settingsRef, 'value', settingsListener);
      off(templatesRef, 'value', templatesListener);
      off(eventsRef, 'value', eventsListener);
      off(sessionKeysRef, 'value', sessionKeysListener);
      off(reviewsRef, 'value', reviewsListener);
    };
  }, [currentTenantId, cacheAllTemplates]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
  }, [settings.theme]);
  
  useEffect(() => {
    const container = document.getElementById('app-container');
    container?.classList.toggle('responsive-mode', appState === AppState.ONLINE_HISTORY);
  }, [appState]);

  useEffect(() => {
    if (!currentSessionKey || !currentTenantId) return;
    let progress = '';
    switch (appState) {
        case AppState.EVENT_SELECTION: progress = 'Memilih Event'; break;
        case AppState.TEMPLATE_SELECTION: progress = 'Memilih Template'; break;
        case AppState.RETAKE_PREVIEW: progress = 'Meninjau Foto'; break;
        case AppState.RATING: progress = 'Memberikan Ulasan'; break;
        case AppState.PREVIEW: progress = 'Melihat Pratinjau Akhir'; break;
    }
    if (progress) {
        update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { progress });
    }
  }, [appState, currentSessionKey, currentTenantId]);
  
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    if (!document.fullscreenElement) {
      appContainer.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else if (!settings.isStrictKioskMode) {
      if (settings.isPinLockEnabled) setIsPinModalOpen(true);
      else if (document.exitFullscreen) document.exitFullscreen();
    }
  }, [settings.isPinLockEnabled, settings.isStrictKioskMode]);

  const handleCorrectPin = useCallback(() => {
    setIsPinModalOpen(false);
    if (document.exitFullscreen && !settings.isStrictKioskMode) {
        document.exitFullscreen();
    }
  }, [settings.isStrictKioskMode]);

  const handleStartSession = useCallback(async () => {
    if (!currentTenantId) return;
    setKeyCodeError(null);
    if (settings.isSessionCodeEnabled) {
      setAppState(AppState.KEY_CODE_ENTRY);
    } else {
      setIsSessionLoading(true);
      try {
        const newKeyData: Omit<SessionKey, 'id'> = {
          code: 'FREEPLAY', maxTakes: Number(settings.freePlayMaxTakes) || 1, takesUsed: 1, status: 'in_progress', createdAt: Date.now(), progress: 'Memilih Event', hasBeenReviewed: false,
        };
        const newKeyRef = await push(ref(db, `data/${currentTenantId}/sessionKeys`), newKeyData);
        if (!newKeyRef.key) throw new Error("Could not get new session key.");
        
        const newKey: SessionKey = { id: newKeyRef.key, ...newKeyData };
        setCurrentSessionKey(newKey);
        setCurrentTakeCount(1);
        setAppState(AppState.EVENT_SELECTION);
      } catch (error) {
        console.error("Error starting free play session:", error);
        setKeyCodeError("Could not start a free session.");
        setAppState(AppState.WELCOME);
      } finally {
        setIsSessionLoading(false);
      }
    }
  }, [settings.isSessionCodeEnabled, settings.freePlayMaxTakes, currentTenantId]);

  const handleKeyCodeSubmit = useCallback(async (code: string) => {
    if (!currentTenantId) return;
    setIsSessionLoading(true);
    setKeyCodeError(null);
    try {
        const q = query(ref(db, `data/${currentTenantId}/sessionKeys`), orderByChild('code'), equalTo(code.toUpperCase()));
        const snapshot = await get(q);
        if (!snapshot.exists()) {
            setKeyCodeError("Kode sesi tidak valid.");
            setIsSessionLoading(false);
            return;
        }
        const data = snapshot.val();
        const keyId = Object.keys(data)[0];
        const sessionKey: SessionKey = { id: keyId, ...data[keyId] };

        if (sessionKey.isUnlimited) {
           // Create a NEW generated session based on this unlimited key
           const newSessionData: Omit<SessionKey, 'id'> = {
             code: `${sessionKey.code}-${Date.now()}`, // Unique internal code, user doesn't see this
             originalCode: sessionKey.code,
             maxTakes: sessionKey.maxTakes,
             takesUsed: 1,
             status: 'in_progress',
             createdAt: Date.now(),
             progress: 'Memilih Event',
             hasBeenReviewed: false,
             isGenerated: true
           };
           const newKeyRef = await push(ref(db, `data/${currentTenantId}/sessionKeys`), newSessionData);
           if (newKeyRef.key) {
              setCurrentSessionKey({ id: newKeyRef.key, ...newSessionData });
              setCurrentTakeCount(1);
              setAppState(AppState.EVENT_SELECTION);
           } else {
             setKeyCodeError("Gagal membuat sesi baru.");
           }
        } else {
          // Standard One-Time Key Logic
          if (sessionKey.status !== 'available') {
              setKeyCodeError(`Kode ini telah ${sessionKey.status === 'completed' ? 'digunakan' : 'sedang berjalan'}.`);
              setIsSessionLoading(false);
              return;
          }
          setCurrentSessionKey(sessionKey);
          setCurrentTakeCount(1);
          await update(ref(db, `data/${currentTenantId}/sessionKeys/${sessionKey.id}`), { status: 'in_progress', takesUsed: 1 });
          setAppState(AppState.EVENT_SELECTION);
        }
    } catch (error) {
        console.error("Error validating session key:", error);
        setKeyCodeError("Terjadi kesalahan. Coba lagi.");
    } finally {
        setIsSessionLoading(false);
    }
  }, [currentTenantId]);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    if (currentSessionKey && currentTenantId) {
        const selectedEvent = events.find(e => e.id === eventId);
        if (selectedEvent) update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { currentEventName: selectedEvent.name });
    }
    setAppState(AppState.TEMPLATE_SELECTION);
  }, [events, currentSessionKey, currentTenantId]);

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setCapturedImages([]);
    if (currentSessionKey && currentTenantId) {
        const totalPhotos = [...new Set(template.photoSlots.map(slot => slot.inputId))].length;
        update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { progress: `Sesi Foto (1/${totalPhotos})`});
    }
    setAppState(AppState.CAPTURE);
  }, [currentSessionKey, currentTenantId]);
  
  const handleSettingsChange = useCallback((newSettings: Settings) => {
    if (currentTenantId) set(ref(db, `data/${currentTenantId}/settings`), newSettings);
  }, [currentTenantId]);

  const handleSaveTemplateMetadata = useCallback((templateToSave: Template) => {
    if (!currentTenantId) return;
    const isNew = templateToSave.id.startsWith('template-');
    const { id, ...dataToSave } = templateToSave;
    if (isNew) push(ref(db, `data/${currentTenantId}/templates`), dataToSave);
    else update(ref(db, `data/${currentTenantId}/templates/${id}`), dataToSave);
    setEditingTemplate(null);
    setAppState(AppState.SETTINGS);
  }, [currentTenantId]);
  
  const handleTemplateLayoutSave = useCallback((newSlots: PhotoSlot[]) => {
    if (!selectedTemplate || !currentTenantId) return;
    update(ref(db, `data/${currentTenantId}/templates/${selectedTemplate.id}`), { photoSlots: newSlots });
    setSelectedTemplate(null);
    setAppState(AppState.TEMPLATE_SELECTION);
  }, [selectedTemplate, currentTenantId]);
  
  const handleDeleteTemplate = useCallback((templateId: string) => {
    if (currentTenantId) remove(ref(db, `data/${currentTenantId}/templates/${templateId}`));
  }, [currentTenantId]);

  // Event Management Handlers
  const handleAddEvent = useCallback((name: string) => {
    if (!currentTenantId) return;
    const { id, ...dataToSave } = { id: '', name, isArchived: false, isQrCodeEnabled: false, qrCodeValue: '', templateOrder: [] };
    push(ref(db, `data/${currentTenantId}/events`), dataToSave);
  }, [currentTenantId]);

  const handleSaveRenameEvent = useCallback((eventId: string, newName: string) => {
    if (currentTenantId) update(ref(db, `data/${currentTenantId}/events/${eventId}`), { name: newName });
    setEditingEvent(null);
  }, [currentTenantId]);
  
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!currentTenantId || !window.confirm("Are you sure?")) return;
    const updates: Record<string, any> = {};
    templates.forEach(t => {
      if (t.eventId === eventId) updates[`/data/${currentTenantId}/templates/${t.id}/eventId`] = null;
    });
    updates[`/data/${currentTenantId}/events/${eventId}`] = null;
    await update(ref(db), updates);
  }, [templates, currentTenantId]);
  
  const handleToggleArchiveEvent = useCallback((eventId: string) => {
    if (!currentTenantId) return;
    const event = events.find(e => e.id === eventId);
    if (event) update(ref(db, `data/${currentTenantId}/events/${eventId}`), { isArchived: !event.isArchived });
  }, [events, currentTenantId]);
  
  const handleSaveTemplateAssignments = useCallback((eventId: string, assignedTemplateIds: string[]) => {
    if (!currentTenantId) return;
    const updates: Record<string, any> = {};
    
    // Save the new order to the event
    updates[`/data/${currentTenantId}/events/${eventId}/templateOrder`] = assignedTemplateIds;

    templates.forEach(t => {
      if (assignedTemplateIds.includes(t.id)) {
        // If template is in the new list, but not assigned to this event yet, assign it
        if (t.eventId !== eventId) {
          updates[`/data/${currentTenantId}/templates/${t.id}/eventId`] = eventId;
        }
      } else if (t.eventId === eventId) {
        // If template was for this event but is not in the new list, unassign it
        updates[`/data/${currentTenantId}/templates/${t.id}/eventId`] = null;
      }
    });

    update(ref(db), updates);
    setAssigningTemplatesEvent(null);
  }, [templates, currentTenantId]);

  const handleSaveQrCodeSettings = useCallback((eventId: string, settings: { qrCodeValue?: string, isQrCodeEnabled?: boolean}) => {
      if (currentTenantId) update(ref(db, `data/${currentTenantId}/events/${eventId}`), settings);
      setEditingEventQr(null);
  }, [currentTenantId]);
  
  // Session Key Handlers
  const handleAddSessionKey = useCallback(async (maxTakes: number, isUnlimited?: boolean) => {
      if (!currentTenantId) return;
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let newCode = '';
      do {
        newCode = '';
        for (let i = 0; i < 4; i++) {
          newCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
      } while (sessionKeys.some(key => key.code === newCode));

      const newKey: Omit<SessionKey, 'id'> = { 
        code: newCode, 
        maxTakes, 
        takesUsed: 0, 
        status: 'available', 
        createdAt: Date.now(), 
        hasBeenReviewed: false, 
        isUnlimited: !!isUnlimited 
      };
      await push(ref(db, `data/${currentTenantId}/sessionKeys`), newKey);
  }, [sessionKeys, currentTenantId]);

  const handleDeleteSessionKey = useCallback(async (keyId: string) => {
      if (currentTenantId && window.confirm("Are you sure?")) {
          await remove(ref(db, `data/${currentTenantId}/sessionKeys/${keyId}`));
      }
  }, [currentTenantId]);
  
  const handleDeleteAllSessionKeys = useCallback(async () => {
    if (!currentTenantId || !window.confirm("Are you sure you want to delete ALL session codes? This cannot be undone.")) return;
    try {
        await remove(ref(db, `data/${currentTenantId}/sessionKeys`));
    } catch (error) {
        console.error("Error deleting all session keys:", error);
        alert("Failed to delete all keys.");
    }
  }, [currentTenantId]);

  const handleDeleteFreeplaySessionKeys = useCallback(async () => {
    if (!currentTenantId || !window.confirm("Are you sure you want to delete all 'FREEPLAY' session codes?")) return;
    
    const freeplayKeys = sessionKeys.filter(key => key.code === 'FREEPLAY');
    if (freeplayKeys.length === 0) {
        alert("No 'FREEPLAY' keys found to delete.");
        return;
    }

    const updates: Record<string, null> = {};
    freeplayKeys.forEach(key => {
        updates[`/data/${currentTenantId}/sessionKeys/${key.id}`] = null;
    });

    try {
        await update(ref(db), updates);
    } catch (error) {
        console.error("Error deleting freeplay session keys:", error);
        alert("Failed to delete freeplay keys.");
    }
  }, [currentTenantId, sessionKeys]);

  // Review Handlers
  const handleSaveReview = useCallback(async (reviewData: Omit<Review, 'id' | 'timestamp' | 'eventId' | 'eventName'>) => {
      const event = events.find(e => e.id === selectedEventId);
      if (!event || !currentSessionKey || !currentTenantId) return;
      const newReview: Omit<Review, 'id'> = { ...reviewData, eventId: event.id, eventName: event.name, timestamp: Date.now() };
      await push(ref(db, `data/${currentTenantId}/reviews`), newReview);
      
      const updates: Partial<SessionKey> = { hasBeenReviewed: true };
      if (settings.isReviewForFreebieEnabled && reviewData.rating === 5) {
        const currentMaxTakes = currentSessionKey.maxTakes;
        // FIX: The value of `settings.reviewFreebieTakesCount` could be undefined, causing a TypeError.
        // Using the nullish coalescing operator provides a default value to ensure the operation is valid.
        const reviewFreebieTakesCount = settings.reviewFreebieTakesCount ?? 1;
        updates.maxTakes = currentMaxTakes + reviewFreebieTakesCount;
      }
      await update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), updates);
      setCurrentSessionKey(prev => prev ? { ...prev, ...updates } : null);
      setAppState(AppState.PREVIEW);
  }, [events, selectedEventId, currentSessionKey, currentTenantId, settings]);

  const handleSkipReview = useCallback(async () => {
    if (currentSessionKey && currentTenantId) {
      await update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { hasBeenReviewed: true });
      setCurrentSessionKey(prev => prev ? { ...prev, hasBeenReviewed: true } : null);
    }
    setAppState(AppState.PREVIEW);
  }, [currentSessionKey, currentTenantId]);
  
  const handleDeleteReview = useCallback(async (reviewId: string) => {
      if (currentTenantId && window.confirm("Are you sure?")) await remove(ref(db, `data/${currentTenantId}/reviews/${reviewId}`));
  }, [currentTenantId]);

  const handleBack = useCallback(() => {
    switch (appState) {
        case AppState.TEMPLATE_SELECTION: setSelectedEventId(null); setAppState(AppState.EVENT_SELECTION); break;
        case AppState.EVENT_SELECTION: handleCancelSession(); break;
        case AppState.KEY_CODE_ENTRY: case AppState.SETTINGS: case AppState.HISTORY: case AppState.ONLINE_HISTORY: setAppState(AppState.WELCOME); break;
        case AppState.MANAGE_EVENTS: case AppState.MANAGE_SESSIONS: case AppState.MANAGE_REVIEWS: case AppState.MANAGE_TENANTS: setAppState(AppState.SETTINGS); break;
        case AppState.PREVIEW: (settings.maxRetakes ?? 0) > 0 ? setAppState(AppState.RETAKE_PREVIEW) : (setCapturedImages([]), setSelectedTemplate(null), setAppState(AppState.TEMPLATE_SELECTION)); break;
        default: setAppState(AppState.WELCOME);
    }
  }, [appState, settings.maxRetakes]);

  // All login functions are just for setting state, App component decides which modal to open
  const handleOpenAdminLogin = useCallback(() => {
    if (currentTenantId === 'master') setIsLoginModalOpen(true);
    else if (currentTenantId) setIsTenantLoginModalOpen(true);
  }, [currentTenantId]);
  
  const handleAdminLogin = useCallback((tenant?: Tenant) => {
    if (tenant) {
      // Tenant login from master page
      setIsAdminLoggedIn(true);
      setIsMasterAdmin(false);
      setIsLoginModalOpen(false);
      window.location.hash = `#/${tenant.path}`;
    } else {
      // Master admin login
      setIsAdminLoggedIn(true);
      setIsMasterAdmin(true);
      setIsLoginModalOpen(false);
    }
  }, []);
  
  const handleTenantAdminLogin = useCallback(() => {
      setIsAdminLoggedIn(true);
      setIsMasterAdmin(false);
      setIsTenantLoginModalOpen(false);
  }, []);
  
  const handleAdminLogout = useCallback(() => {
      setIsAdminLoggedIn(false);
      setIsMasterAdmin(false);
  }, []);

  const handleSessionEnd = useCallback(() => {
    if (currentSessionKey && currentTenantId) {
        // If session was 'unlimited' derived, we don't delete it, but marking as completed is fine.
        // If session was FREEPLAY, we delete it.
        if (currentSessionKey.code.startsWith('FREEPLAY')) { // Check startsWith in case we append ID later for uniqueness
            remove(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`));
        } else {
            update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { status: 'completed', progress: null, currentEventName: null });
        }
    }
    setCapturedImages([]);
    setSelectedTemplate(null);
    setSelectedEventId(null);
    setCurrentSessionKey(null);
    setCurrentTakeCount(0);
    setRetakesUsed(0);
    setRetakingPhotoIndex(null);
    setAppState(AppState.WELCOME);
  }, [currentSessionKey, currentTenantId]);

  const handleCancelSession = useCallback(() => {
      if (currentSessionKey && currentTenantId) {
        // If isGenerated, we can just delete it on cancel to clean up? Or mark as available?
        // If it's a standard one-time key, mark available.
        // If Freeplay, delete.
          if (currentSessionKey.code.startsWith('FREEPLAY')) {
              remove(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`));
          } else if (currentSessionKey.isGenerated) {
             // Optionally delete generated sessions on cancel to avoid clutter
             remove(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`));
          } else {
              update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { status: 'available', takesUsed: 0, progress: null, currentEventName: null });
          }
      }
      handleSessionEnd();
  }, [currentSessionKey, currentTenantId, handleSessionEnd]);

  const handleCaptureProgressUpdate = useCallback((current: number, total: number) => {
    if (currentSessionKey && currentTenantId) {
        update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { progress: `Sesi Foto (${current}/${total})` });
    }
  }, [currentSessionKey, currentTenantId]);
  
  // Tenant (Admin) Management
  const handleAddTenant = useCallback(async (tenantData: Partial<Tenant>) => {
    const { username, password, path } = tenantData;
    if (!username || !password || !path) return alert("Username, password, and path are required.");
    
    const newTenantData: Omit<Tenant, 'id'> = {
        username, password, path, isActive: true, createdAt: Date.now()
    };
    const newTenantRef = await push(ref(db, 'tenants'), newTenantData);
    const newTenantId = newTenantRef.key;
    if (!newTenantId) return;

    await set(ref(db, `data/${newTenantId}/settings`), DEFAULT_SETTINGS);

    const masterTemplatesSnapshot = await get(ref(db, 'data/master/templates'));
    if (masterTemplatesSnapshot.exists()) {
        await set(ref(db, `data/${newTenantId}/templates`), masterTemplatesSnapshot.val());
    }
  }, []);
  
  const handleUpdateTenant = useCallback(async (tenantData: Partial<Tenant>) => {
    const { id, ...dataToUpdate } = tenantData;
    if (!id) return;
    if (dataToUpdate.password === '') delete dataToUpdate.password;
    await update(ref(db, `tenants/${id}`), dataToUpdate);
  }, []);
  
  const handleDeleteTenant = useCallback(async (tenantId: string) => {
    if (!window.confirm("This will delete the admin and ALL their data (settings, templates, history, etc). This cannot be undone. Continue?")) return;
    const updates: Record<string, any> = {};
    updates[`/tenants/${tenantId}`] = null;
    updates[`/data/${tenantId}`] = null;
    await update(ref(db), updates);
  }, []);

  const handleUploadToDrive = useCallback((imageDataUrl: string) => {
    const uploadId = Date.now();
    setUploadInfo({ id: uploadId, progress: 0, status: 'uploading' });

    const progressInterval = setInterval(() => {
        setUploadInfo(prev => {
            if (prev.id !== uploadId || prev.status !== 'uploading') {
                clearInterval(progressInterval);
                return prev;
            }
            if (prev.progress >= 95) {
                clearInterval(progressInterval);
                return prev;
            }
            return { ...prev, progress: prev.progress + Math.random() * 10 };
        });
    }, 400);

    (async () => {
        try {
            const filename = `sans-photo-${Date.now()}.png`;
            const payload = JSON.stringify({ foto: imageDataUrl, nama: filename });

            await fetch(SCRIPT_URL_RETAKE, {
                method: 'POST',
                mode: 'no-cors',
                body: payload,
            });

            clearInterval(progressInterval);
            setUploadInfo(prev => prev.id === uploadId ? { ...prev, progress: 100, status: 'success' } : prev);
            
            setTimeout(() => {
                setUploadInfo(prev => prev.id === uploadId ? { ...prev, status: 'idle' } : prev);
            }, 3000);

        } catch (error) {
            console.error("Background upload failed:", error);
            clearInterval(progressInterval);
            setUploadInfo(prev => prev.id === uploadId ? { ...prev, status: 'error' } : prev);
        }
    })();
  }, []);

  // Other callbacks that just change state
  const handleGoToSettings = useCallback(() => setAppState(AppState.SETTINGS), []);
  const handleViewHistory = useCallback(() => { if (isAdminLoggedIn) setAppState(AppState.HISTORY); }, [isAdminLoggedIn]);
  const handleViewOnlineHistory = useCallback(() => setAppState(AppState.ONLINE_HISTORY), []);
  const handleStartAddTemplate = useCallback(() => { setEditingTemplate({ id: `template-${Date.now()}`, name: 'New Template', imageUrl: '', widthMM: 102, heightMM: 152, orientation: 'portrait', photoSlots: [...INITIAL_PHOTO_SLOTS] }); setAppState(AppState.EDIT_TEMPLATE_METADATA); }, []);
  const handleStartEditTemplateMetadata = useCallback((template: Template) => { setEditingTemplate(template); setAppState(AppState.EDIT_TEMPLATE_METADATA); }, []);
  const handleCancelEditTemplateMetadata = useCallback(() => { setEditingTemplate(null); setAppState(AppState.SETTINGS); }, []);
  const handleStartEditLayout = useCallback((template: Template) => { setSelectedTemplate(template); setAppState(AppState.EDIT_TEMPLATE_LAYOUT); }, []);
  const handleEditLayoutCancel = useCallback(() => { setSelectedTemplate(null); setAppState(AppState.TEMPLATE_SELECTION); }, []);
  const handleStartRenameEvent = useCallback((event: Event) => setEditingEvent(event), []);
  const handleCancelRenameEvent = useCallback(() => setEditingEvent(null), []);
  const handleStartAssigningTemplates = useCallback((event: Event) => setAssigningTemplatesEvent(event), []);
  const handleCancelAssigningTemplates = useCallback(() => setAssigningTemplatesEvent(null), []);
  const handleStartEditQrCode = useCallback((event: Event) => setEditingEventQr(event), []);
  const handleCancelEditQrCode = useCallback(() => setEditingEventQr(null), []);
  const handleManageTemplates = useCallback(() => { setAppState(AppState.SETTINGS); setTimeout(() => setAppState(AppState.TEMPLATE_SELECTION), 0); }, []);
  const handleManageEvents = useCallback(() => setAppState(AppState.MANAGE_EVENTS), []);
  const handleManageSessions = useCallback(() => setAppState(AppState.MANAGE_SESSIONS), []);
  const handleManageReviews = useCallback(() => setAppState(AppState.MANAGE_REVIEWS), []);
  const handleManageTenants = useCallback(() => setAppState(AppState.MANAGE_TENANTS), []);
  // Capture/Retake callbacks
  const decideNextStepAfterCapture = useCallback(() => {
    if (currentSessionKey && currentTakeCount >= currentSessionKey.maxTakes && !(currentSessionKey.hasBeenReviewed)) setAppState(AppState.RATING);
    else setAppState(AppState.PREVIEW);
  }, [currentSessionKey, currentTakeCount]);
  const handleCaptureComplete = useCallback((images: string[]) => { setCapturedImages(images); if ((settings.maxRetakes ?? 0) > 0) setAppState(AppState.RETAKE_PREVIEW); else decideNextStepAfterCapture(); }, [settings.maxRetakes, decideNextStepAfterCapture]);
  const handleStartRetake = useCallback((photoIndex: number) => { if (settings.maxRetakes === undefined || retakesUsed >= settings.maxRetakes) return; setRetakesUsed(prev => prev + 1); setRetakingPhotoIndex(photoIndex); setAppState(AppState.CAPTURE); }, [retakesUsed, settings.maxRetakes]);
  const handleRetakeComplete = useCallback((newImage: string) => { if (retakingPhotoIndex === null) return; setCapturedImages(prev => { const newImages = [...prev]; newImages[retakingPhotoIndex] = newImage; return newImages; }); setRetakingPhotoIndex(null); setAppState(AppState.RETAKE_PREVIEW); }, [retakingPhotoIndex]);
  const handleFinishRetakePreview = useCallback((imageDataUrl: string) => {
    handleUploadToDrive(imageDataUrl);
    decideNextStepAfterCapture();
  }, [handleUploadToDrive, decideNextStepAfterCapture]);
  const handleStartNextTake = useCallback(() => { if (!currentSessionKey || currentTakeCount >= currentSessionKey.maxTakes) return; const nextTake = currentTakeCount + 1; setCurrentTakeCount(nextTake); if(currentTenantId) update(ref(db, `data/${currentTenantId}/sessionKeys/${currentSessionKey.id}`), { takesUsed: nextTake }); setCapturedImages([]); setSelectedTemplate(null); setRetakesUsed(0); setRetakingPhotoIndex(null); setAppState(AppState.TEMPLATE_SELECTION); }, [currentSessionKey, currentTakeCount, currentTenantId]);
  const handleSaveHistoryFromSession = useCallback(async (imageDataUrl: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;
    const timestamp = Date.now();
    const newEntry: HistoryEntry = { id: String(timestamp), eventId: event.id, eventName: event.name, imageDataUrl, timestamp: timestamp };
    await addHistoryEntry(newEntry);
    setHistory(prev => [newEntry, ...prev].sort((a,b) => b.timestamp - a.timestamp));
  }, [events, selectedEventId]);

  const renderContent = () => {
    if (tenantNotFound) return <TenantNotFoundScreen />;
    if (!currentTenantId) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
    
    const selectedEvent = events.find(e => e.id === selectedEventId) || null;
    const isAppClosed = settings.isClosedModeEnabled && settings.reopenTimestamp && Date.now() < settings.reopenTimestamp;

    if (isAppClosed && !isAdminLoggedIn) {
        return <ClosedScreen reopenTimestamp={settings.reopenTimestamp || 0} onAdminLoginClick={handleOpenAdminLogin} />;
    }
      
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen onStart={handleStartSession} onSettingsClick={handleGoToSettings} onViewHistory={handleViewHistory} onViewOnlineHistory={handleViewOnlineHistory} isAdminLoggedIn={isAdminLoggedIn} isCaching={isCaching} cachingProgress={cachingProgress} onAdminLoginClick={handleOpenAdminLogin} onAdminLogoutClick={handleAdminLogout} isLoading={isSessionLoading} settings={settings} reviews={reviews} />;
      case AppState.KEY_CODE_ENTRY: return <KeyCodeScreen onKeyCodeSubmit={handleKeyCodeSubmit} onBack={handleBack} error={keyCodeError} isLoading={isSessionLoading} />;
      case AppState.EVENT_SELECTION: return <EventSelectionScreen events={events.filter(e => !e.isArchived)} onSelect={handleEventSelect} onBack={handleBack} />;
      case AppState.TEMPLATE_SELECTION:
        const eventTemplates = templates.filter(t => isAdminLoggedIn ? true : t.eventId === selectedEventId);
        let sortedTemplates = eventTemplates;
        if (selectedEvent?.templateOrder) {
            const orderMap = new Map(selectedEvent.templateOrder.map((id, index) => [id, index]));
            sortedTemplates = [...eventTemplates].sort((a, b) => {
                const indexA = orderMap.get(a.id);
                const indexB = orderMap.get(b.id);
                if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
                if (indexA !== undefined) return -1; // a is ordered, b is not
                if (indexB !== undefined) return 1; // b is ordered, a is not
                return a.name.localeCompare(b.name); // neither are ordered, sort by name
            });
        }
        return <TemplateSelection templates={sortedTemplates} onSelect={handleTemplateSelect} onBack={handleBack} isAdminLoggedIn={isAdminLoggedIn} onAddTemplate={handleStartAddTemplate} onEditMetadata={handleStartEditTemplateMetadata} onEditLayout={handleStartEditLayout} onDelete={handleDeleteTemplate} />;
      case AppState.SETTINGS: return <SettingsScreen settings={settings} onSettingsChange={handleSettingsChange} onManageTemplates={handleManageTemplates} onManageEvents={handleManageEvents} onManageSessions={handleManageSessions} onManageReviews={handleManageReviews} onViewHistory={handleViewHistory} onBack={handleBack} isMasterAdmin={isMasterAdmin} onManageTenants={handleManageTenants} />;
      case AppState.MANAGE_TENANTS: if (!isMasterAdmin) { setAppState(AppState.WELCOME); return null; } return <ManageTenantsScreen tenants={tenants} onBack={handleBack} onAddTenant={handleAddTenant} onUpdateTenant={handleUpdateTenant} onDeleteTenant={handleDeleteTenant} />;
      case AppState.MANAGE_EVENTS: return <ManageEventsScreen events={events} onBack={handleBack} onAddEvent={handleAddEvent} onRenameEvent={handleStartRenameEvent} onDeleteEvent={handleDeleteEvent} onToggleArchive={handleToggleArchiveEvent} onAssignTemplates={handleStartAssigningTemplates} onQrCodeSettings={handleStartEditQrCode} />;
      case AppState.MANAGE_SESSIONS: if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; } return <ManageSessionsScreen sessionKeys={sessionKeys} onBack={handleBack} onAddKey={handleAddSessionKey} onDeleteKey={handleDeleteSessionKey} onDeleteAllKeys={handleDeleteAllSessionKeys} onDeleteFreeplayKeys={handleDeleteFreeplaySessionKeys} />;
      case AppState.MANAGE_REVIEWS: if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; } return <ManageReviewsScreen reviews={reviews} onBack={handleBack} onDelete={handleDeleteReview} />;
      case AppState.HISTORY: if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; } return <HistoryScreen history={history} events={events} onDelete={deleteHistoryEntry} onBack={handleBack} />;
      case AppState.ONLINE_HISTORY: return <OnlineHistoryScreen onBack={handleBack} />;
      case AppState.EDIT_TEMPLATE_METADATA: if (!isAdminLoggedIn || !editingTemplate) { setAppState(AppState.WELCOME); return null; } return <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />;
      case AppState.EDIT_TEMPLATE_LAYOUT: if (!isAdminLoggedIn || !selectedTemplate) { setAppState(AppState.WELCOME); return null; } return <EditTemplateScreen template={selectedTemplate} onSave={handleTemplateLayoutSave} onCancel={handleEditLayoutCancel} />;
      case AppState.CAPTURE: if (!selectedTemplate) { setAppState(AppState.WELCOME); return null; } return <CaptureScreen template={selectedTemplate} countdownDuration={settings.countdownDuration} flashEffectEnabled={settings.flashEffectEnabled} cameraSourceType={settings.cameraSourceType} ipCameraUrl={settings.ipCameraUrl} onCaptureComplete={handleCaptureComplete} onRetakeComplete={handleRetakeComplete} retakeForIndex={retakingPhotoIndex} onProgressUpdate={handleCaptureProgressUpdate} existingImages={capturedImages} />;
      case AppState.RETAKE_PREVIEW: if (!selectedTemplate) { setAppState(AppState.WELCOME); return null; } return <RetakePreviewScreen images={capturedImages} template={selectedTemplate} onStartRetake={handleStartRetake} onDone={handleFinishRetakePreview} retakesUsed={retakesUsed} maxRetakes={settings.maxRetakes ?? 0} />;
      case AppState.RATING: if (!selectedEvent || !currentSessionKey || currentSessionKey.hasBeenReviewed) { setAppState(AppState.PREVIEW); return null; } return <RatingScreen eventName={selectedEvent.name} onSubmit={handleSaveReview} onSkip={handleSkipReview} settings={settings} />;
      case AppState.PREVIEW: if (!selectedTemplate || !currentSessionKey) { setAppState(AppState.WELCOME); return null; } return <PreviewScreen images={capturedImages} onRestart={handleSessionEnd} onBack={handleBack} template={selectedTemplate} onSaveHistory={handleSaveHistoryFromSession} event={selectedEvent} currentTake={currentTakeCount} maxTakes={currentSessionKey.maxTakes} onNextTake={handleStartNextTake} isDownloadButtonEnabled={settings.isDownloadButtonEnabled ?? true} isAutoDownloadEnabled={settings.isAutoDownloadEnabled ?? true} printSettings={{ isEnabled: settings.isPrintButtonEnabled ?? true, paperSize: settings.printPaperSize ?? '4x6', colorMode: settings.printColorMode ?? 'color', isCopyInputEnabled: settings.isPrintCopyInputEnabled ?? true, maxCopies: settings.printMaxCopies ?? 5, }} />;
      default: return <WelcomeScreen onStart={handleStartSession} onSettingsClick={handleGoToSettings} onViewHistory={handleViewHistory} onViewOnlineHistory={handleViewOnlineHistory} isAdminLoggedIn={isAdminLoggedIn} isCaching={isCaching} cachingProgress={cachingProgress} onAdminLoginClick={handleOpenAdminLogin} onAdminLogoutClick={handleAdminLogout} isLoading={isSessionLoading} settings={settings} reviews={reviews} />;
    }
  };
  
  const currentTenant = tenants.find(t => t.id === currentTenantId);

  return (
    <div className="h-full bg-[var(--color-bg-primary)] flex flex-col items-center justify-center text-[var(--color-text-primary)] relative">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={toggleFullscreen} className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          <FullscreenIcon isFullscreen={isFullscreen} />
        </button>
      </div>
      
      {isLoginModalOpen && <LoginModal tenants={tenants} onLogin={handleAdminLogin} onClose={() => setIsLoginModalOpen(false)} />}
      {isTenantLoginModalOpen && currentTenant && <TenantLoginModal tenant={currentTenant} onLogin={handleTenantAdminLogin} onClose={() => setIsTenantLoginModalOpen(false)} />}
      {isPinModalOpen && <PinInputModal correctPin={settings.fullscreenPin || '1234'} onCorrectPin={handleCorrectPin} onClose={() => setIsPinModalOpen(false)} />}
      {editingEvent && <RenameEventModal event={editingEvent} onSave={handleSaveRenameEvent} onClose={handleCancelRenameEvent} />}
      {assigningTemplatesEvent && <AssignTemplatesModal event={assigningTemplatesEvent} allTemplates={templates} onSave={handleSaveTemplateAssignments} onClose={handleCancelAssigningTemplates} />}
      {editingEventQr && <EventQrCodeModal event={editingEventQr} onSave={handleSaveQrCodeSettings} onClose={handleCancelEditQrCode} />}
      {appState === AppState.EDIT_TEMPLATE_METADATA && editingTemplate && <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />}
      
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

      {uploadInfo.status !== 'idle' && (
          <GlobalUploadIndicator status={uploadInfo.status} progress={uploadInfo.progress} />
      )}
    </div>
  );
};

export default App;
