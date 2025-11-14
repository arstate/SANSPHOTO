export enum AppState {
  WELCOME,
  EVENT_SELECTION,
  TEMPLATE_SELECTION,
  SETTINGS,
  MANAGE_EVENTS,
  EDIT_TEMPLATE_METADATA,
  EDIT_TEMPLATE_LAYOUT,
  CAPTURE,
  PREVIEW,
  HISTORY,
}

export interface PhotoSlot {
  id: number;
  inputId: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Settings {
  countdownDuration: number;
  flashEffectEnabled: boolean;
  isPinLockEnabled?: boolean;
  fullscreenPin?: string;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  widthMM: number;
  heightMM: number;
  photoSlots: PhotoSlot[];
  orientation: 'portrait' | 'landscape';
  eventId?: string; // Link to an event
}

export interface Event {
  id: string;
  name: string;
  isArchived: boolean;
  qrCodeImageUrl?: string;
  isQrCodeEnabled?: boolean;
}

export interface HistoryEntry {
  id: string;
  eventId: string;
  eventName: string;
  imageDataUrl: string;
  timestamp: number;
}