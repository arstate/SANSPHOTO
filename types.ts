
export enum AppState {
  WELCOME,
  KEY_CODE_ENTRY,
  EVENT_SELECTION,
  TEMPLATE_SELECTION,
  SETTINGS,
  MANAGE_EVENTS,
  MANAGE_SESSIONS,
  EDIT_TEMPLATE_METADATA,
  EDIT_TEMPLATE_LAYOUT,
  CAPTURE,
  PREVIEW,
  HISTORY,
  ONLINE_HISTORY,
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
  isStrictKioskMode?: boolean;
  isSessionCodeEnabled?: boolean;
  freePlayMaxTakes?: number;
  theme?: 'light' | 'dark';
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  isDownloadButtonEnabled?: boolean;
  isAutoDownloadEnabled?: boolean;
  welcomeTitleColor?: string;
  welcomeSubtitleColor?: string;
  welcomeBgType?: 'default' | 'color' | 'image' | 'camera';
  welcomeBgColor?: string;
  welcomeBgImageUrl?: string;
  welcomeBgZoom?: number;
  isWelcomeTextShadowEnabled?: boolean;
  welcomeTitleFont?: string;
  welcomeSubtitleFont?: string;
  isWelcomeTitleFontRandom?: boolean;
  isWelcomeSubtitleFontRandom?: boolean;
  startButtonText?: string;
  startButtonBgColor?: string;
  startButtonTextColor?: string;
  isStartButtonShadowEnabled?: boolean;
  // Print Settings
  isPrintButtonEnabled?: boolean;
  printPaperSize?: '4x6' | 'A4_portrait' | 'A4_landscape';
  printColorMode?: 'color' | 'grayscale';
  isPrintCopyInputEnabled?: boolean;
  printMaxCopies?: number;
  // Closed Mode Settings
  isClosedModeEnabled?: boolean;
  reopenTimestamp?: number;
  // Online History Settings
  isOnlineHistoryEnabled?: boolean;
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

export interface OnlineHistoryEntry {
  id: string;
  googlePhotosUrl: string;
  timestamp: number;
}

export type SessionKeyStatus = 'available' | 'in_progress' | 'completed';

export interface SessionKey {
  id: string;
  code: string;
  maxTakes: number;
  takesUsed: number;
  status: SessionKeyStatus;
  createdAt: number;
  progress?: string;
  currentEventName?: string;
}