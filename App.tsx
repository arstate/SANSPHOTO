
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
import { AppState, PhotoSlot, Settings, Template, Event, HistoryEntry } from './types';
import { db, ref, onValue, off, set, push, update, remove, firebaseObjectToArray } from './firebase';

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
};

const DEFAULT_TEMPLATE_DATA: Omit<Template, 'id'> = {
  name: 'Portrait 4x6',
  imageUrl: 'https://lh3.googleusercontent.com/pw/AP1GczMwGZ8j7Lessgx9F6qavNTLnoC1UodPtOLNCDQf7vMM_sFZdxkg-ADr8yLGa0aaFtaS_TAut_FQTfmgt3rwzaWL5cCEawjyp64oQMkJC3aZrd7fRXQ=w2400',
  widthMM: 102,
  heightMM: 152,
  photoSlots: INITIAL_PHOTO_SLOTS,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  useEffect(() => {
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
            setTemplates(firebaseObjectToArray<Template>(snapshot.val()));
        } else {
            push(templatesRef, DEFAULT_TEMPLATE_DATA);
        }
    });

    // Events listener
    const eventsRef = ref(db, 'events');
    const eventsListener = onValue(eventsRef, (snapshot) => {
        setEvents(firebaseObjectToArray<Event>(snapshot.val()));
    });

    // History listener
    const historyRef = ref(db, 'history');
    const historyListener = onValue(historyRef, (snapshot) => {
        const historyData = firebaseObjectToArray<HistoryEntry>(snapshot.val());
        historyData.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(historyData);
    });

    return () => {
      off(settingsRef, 'value', settingsListener);
      off(templatesRef, 'value', templatesListener);
      off(eventsRef, 'value', eventsListener);
      off(historyRef, 'value', historyListener);
    };
  }, []);

  const handleStartSession = useCallback(() => {
    setAppState(AppState.EVENT_SELECTION);
  }, []);

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setAppState(AppState.TEMPLATE_SELECTION);
  }, []);

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setCapturedImages([]);
    setAppState(AppState.CAPTURE);
  }, []);
  
  const handleManageTemplates = useCallback(() => {
    setAppState(AppState.TEMPLATE_SELECTION);
  }, []);

  const handleManageEvents = useCallback(() => {
    setAppState(AppState.MANAGE_EVENTS);
  }, []);

  const handleGoToSettings = useCallback(() => {
    setAppState(AppState.SETTINGS);
  }, []);
  
  const handleViewHistory = useCallback(() => {
      if (isAdminLoggedIn) {
          setAppState(AppState.HISTORY);
      }
  }, [isAdminLoggedIn]);
  
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
    // FIX: The type of newEvent was changed from `Omit<Event, 'id'>` to `Event`.
    // The original type caused an error because the object literal included an `id` property.
    // This change also fixes the subsequent destructuring error on the next line.
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

  // History Handlers
  const handleSaveHistoryFromSession = useCallback((imageDataUrl: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;
    
    const newEntry: Omit<HistoryEntry, 'id'> = {
        eventId: event.id,
        eventName: event.name,
        imageDataUrl,
        timestamp: Date.now(),
    };
    push(ref(db, 'history'), newEntry);
  }, [events, selectedEventId]);

  const handleUploadHistory = useCallback((imageDataUrl: string, eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        console.error('Selected event for upload not found');
        return;
    }
     const newEntry: Omit<HistoryEntry, 'id'> = {
        eventId: event.id,
        eventName: event.name,
        imageDataUrl,
        timestamp: Date.now(),
    };
    push(ref(db, 'history'), newEntry);
  }, [events]);

  const handleDeleteHistoryEntry = useCallback((entryId: string) => {
      if (!window.confirm("Are you sure you want to delete this history entry?")) return;
      remove(ref(db, `history/${entryId}`));
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
        case AppState.SETTINGS:
        case AppState.HISTORY:
            setAppState(AppState.WELCOME);
            break;
        case AppState.MANAGE_EVENTS:
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

  const handleRestart = useCallback(() => {
    setCapturedImages([]);
    setSelectedTemplate(null);
    setSelectedEventId(null);
    setAppState(AppState.WELCOME);
  }, []);

  const renderContent = () => {
    const selectedEvent = events.find(e => e.id === selectedEventId) || null;
      
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen onStart={handleStartSession} onAdminLoginClick={handleOpenLoginModal} onAdminLogout={handleAdminLogout} onSettingsClick={handleGoToSettings} onViewHistory={handleViewHistory} isAdminLoggedIn={isAdminLoggedIn} />;
      
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
        return <SettingsScreen settings={settings} onSettingsChange={handleSettingsChange} onManageTemplates={handleManageTemplates} onManageEvents={handleManageEvents} onViewHistory={handleViewHistory} onBack={handleBack} />;
      
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
         
      case AppState.HISTORY:
          if (!isAdminLoggedIn) { setAppState(AppState.WELCOME); return null; }
          return <HistoryScreen history={history} events={events} onDelete={handleDeleteHistoryEntry} onBack={handleBack} onUpload={handleUploadHistory} />;

      case AppState.EDIT_TEMPLATE_METADATA:
        if (!isAdminLoggedIn || !editingTemplate) { setAppState(AppState.WELCOME); return null; }
        return <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />;
      
      case AppState.EDIT_TEMPLATE_LAYOUT:
        if (!isAdminLoggedIn || !selectedTemplate) { setAppState(AppState.WELCOME); return null; }
        return <EditTemplateScreen template={selectedTemplate} onSave={handleTemplateLayoutSave} onCancel={handleEditLayoutCancel} />;
      
      case AppState.CAPTURE:
        if (!selectedTemplate) { setAppState(AppState.WELCOME); return null; }
        return <CaptureScreen onComplete={handleCaptureComplete} template={selectedTemplate} countdownDuration={settings.countdownDuration} flashEffectEnabled={settings.flashEffectEnabled} />;
      
      case AppState.PREVIEW:
        if (!selectedTemplate) { setAppState(AppState.WELCOME); return null; }
        return <PreviewScreen images={capturedImages} onRestart={handleRestart} template={selectedTemplate} onBack={handleBack} onSaveHistory={handleSaveHistoryFromSession} event={selectedEvent} />;
      
      default:
        return <WelcomeScreen onStart={handleStartSession} onAdminLoginClick={handleOpenLoginModal} onAdminLogout={handleAdminLogout} onSettingsClick={handleGoToSettings} onViewHistory={handleViewHistory} isAdminLoggedIn={isAdminLoggedIn} />;
    }
  };
  
  const mainClasses = `w-full ${
    appState === AppState.CAPTURE || appState === AppState.EDIT_TEMPLATE_LAYOUT || appState === AppState.TEMPLATE_SELECTION || appState === AppState.MANAGE_EVENTS || appState === AppState.HISTORY
    ? 'max-w-7xl'
    : 'max-w-lg'
  } mx-auto`;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-2 md:p-4">
      {isLoginModalOpen && <LoginModal onLogin={handleAdminLogin} onClose={handleCloseLoginModal} />}
      {editingEvent && <RenameEventModal event={editingEvent} onSave={handleSaveRenameEvent} onClose={handleCancelRenameEvent} />}
      {assigningTemplatesEvent && <AssignTemplatesModal event={assigningTemplatesEvent} allTemplates={templates} onSave={handleSaveTemplateAssignments} onClose={handleCancelAssigningTemplates} />}
      {editingEventQr && <EventQrCodeModal event={editingEventQr} onSave={handleSaveQrCodeSettings} onClose={handleCancelEditQrCode} />}
      {appState === AppState.EDIT_TEMPLATE_METADATA && editingTemplate && (
         <TemplateMetadataModal template={editingTemplate} onSave={handleSaveTemplateMetadata} onClose={handleCancelEditTemplateMetadata} />
      )}
      
      <main className={mainClasses}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
