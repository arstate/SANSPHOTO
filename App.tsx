import React, { useState, useCallback } from 'react';
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

const DEFAULT_TEMPLATE: Template = {
  id: 'default-1',
  name: 'Portrait 4x6',
  imageUrl: 'https://lh3.googleusercontent.com/pw/AP1GczMwGZ8j7Lessgx9F6qavNTLnoC1UodPtOLNCDQf7vMM_sFZdxkg-ADr8yLGa0aaFtaS_TAut_FQTfmgt3rwzaWL5cCEawjyp64oQMkJC3aZrd7fRXQ=w2400',
  widthMM: 102,
  heightMM: 152,
  photoSlots: INITIAL_PHOTO_SLOTS,
};

const TEMPLATES_STORAGE_KEY = 'sans-photo-templates';
const SETTINGS_STORAGE_KEY = 'sans-photo-settings';
const EVENTS_STORAGE_KEY = 'sans-photo-events';
const HISTORY_STORAGE_KEY = 'sans-photo-history';

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
  
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      const parsed = savedTemplates ? JSON.parse(savedTemplates) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_TEMPLATE];
    } catch (e) {
      console.error("Failed to load templates from storage", e);
      return [DEFAULT_TEMPLATE];
    }
  });

  const [events, setEvents] = useState<Event[]>(() => {
    try {
        const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
        const parsed = savedEvents ? JSON.parse(savedEvents) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Failed to load events from storage", e);
        return [];
    }
  });
  
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
      try {
          const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
          return savedHistory ? JSON.parse(savedHistory) : [];
      } catch (e) {
          console.error("Failed to load history from storage", e);
          return [];
      }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = savedSettings ? JSON.parse(savedSettings) : {};
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.error("Failed to load settings from storage", e);
      return DEFAULT_SETTINGS;
    }
  });

  const saveTemplates = useCallback((newTemplates: Template[]) => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (e) {
      console.error("Failed to save templates to storage", e);
    }
  }, []);

  const saveEvents = useCallback((newEvents: Event[]) => {
      try {
          localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
          setEvents(newEvents);
      } catch (e) {
          console.error("Failed to save events to storage", e);
      }
  }, []);
  
  const saveHistory = useCallback((newHistory: HistoryEntry[]) => {
      try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
          setHistory(newHistory);
      } catch(e) {
          console.error("Failed to save history to storage", e);
      }
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
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save settings to storage", e);
    }
    setSettings(newSettings);
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
    const existingIndex = templates.findIndex(t => t.id === templateToSave.id);
    let newTemplates;
    if (existingIndex > -1) {
      newTemplates = [...templates];
      newTemplates[existingIndex] = templateToSave;
    } else {
      newTemplates = [...templates, templateToSave];
    }
    saveTemplates(newTemplates);
    setEditingTemplate(null);
    setAppState(AppState.SETTINGS);
  }, [templates, saveTemplates]);
  
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
    const updatedTemplate = { ...selectedTemplate, photoSlots: newSlots };
    const newTemplates = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    saveTemplates(newTemplates);
    setSelectedTemplate(null);
    setAppState(AppState.SETTINGS);
  }, [selectedTemplate, templates, saveTemplates]);
  
  const handleDeleteTemplate = useCallback((templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const handleEditLayoutCancel = useCallback(() => {
    setSelectedTemplate(null);
    setAppState(AppState.SETTINGS);
  }, []);
  
  // Event Management Handlers
  const handleAddEvent = useCallback((name: string) => {
    const newEvent: Event = { id: `event-${Date.now()}`, name, isArchived: false, isQrCodeEnabled: false, qrCodeImageUrl: '' };
    saveEvents([...events, newEvent]);
  }, [events, saveEvents]);

  const handleStartRenameEvent = useCallback((event: Event) => setEditingEvent(event), []);
  const handleCancelRenameEvent = useCallback(() => setEditingEvent(null), []);
  const handleSaveRenameEvent = useCallback((eventId: string, newName: string) => {
    saveEvents(events.map(e => e.id === eventId ? { ...e, name: newName } : e));
    setEditingEvent(null);
  }, [events, saveEvents]);
  
  const handleDeleteEvent = useCallback((eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    // Unassign templates from this event
    const newTemplates = templates.map(t => t.eventId === eventId ? { ...t, eventId: undefined } : t);
    saveTemplates(newTemplates);
    // Delete the event
    const newEvents = events.filter(e => e.id !== eventId);
    saveEvents(newEvents);
  }, [events, templates, saveEvents, saveTemplates]);
  
  const handleToggleArchiveEvent = useCallback((eventId: string) => {
    saveEvents(events.map(e => e.id === eventId ? { ...e, isArchived: !e.isArchived } : e));
  }, [events, saveEvents]);
  
  const handleStartAssigningTemplates = useCallback((event: Event) => setAssigningTemplatesEvent(event), []);
  const handleCancelAssigningTemplates = useCallback(() => setAssigningTemplatesEvent(null), []);
  const handleSaveTemplateAssignments = useCallback((eventId: string, assignedTemplateIds: string[]) => {
    const newTemplates = templates.map(t => {
      if (assignedTemplateIds.includes(t.id)) {
        return { ...t, eventId }; // Assign to this event
      }
      if (t.eventId === eventId) {
        return { ...t, eventId: undefined }; // Unassign if it was previously assigned
      }
      return t;
    });
    saveTemplates(newTemplates);
    setAssigningTemplatesEvent(null);
  }, [templates, saveTemplates]);

  // QR Code handlers
  const handleStartEditQrCode = useCallback((event: Event) => setEditingEventQr(event), []);
  const handleCancelEditQrCode = useCallback(() => setEditingEventQr(null), []);
  const handleSaveQrCodeSettings = useCallback((eventId: string, settings: { qrCodeImageUrl?: string, isQrCodeEnabled?: boolean}) => {
      saveEvents(events.map(e => e.id === eventId ? { ...e, ...settings } : e));
      setEditingEventQr(null);
  }, [events, saveEvents]);

  // History Handlers
  const handleSaveHistory = useCallback((imageDataUrl: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;
    
    const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        imageDataUrl,
        timestamp: Date.now(),
    };
    saveHistory([newEntry, ...history]);
  }, [events, selectedEventId, history, saveHistory]);

  const handleDeleteHistoryEntry = useCallback((entryId: string) => {
      if (!window.confirm("Are you sure you want to delete this history entry?")) return;
      saveHistory(history.filter(entry => entry.id !== entryId));
  }, [history, saveHistory]);

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
          return <HistoryScreen history={history} events={events} onDelete={handleDeleteHistoryEntry} onBack={handleBack} />;

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
        return <PreviewScreen images={capturedImages} onRestart={handleRestart} template={selectedTemplate} onBack={handleBack} onSaveHistory={handleSaveHistory} event={selectedEvent} />;
      
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