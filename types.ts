
export enum AppState {
  WELCOME,
  CAPTURE,
  PREVIEW,
}

export interface PhotoSlot {
  id: number;
  inputId: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// FIX: Added all missing optional settings properties to satisfy type checks in SettingsScreen.
export interface Settings {
  countdownDuration: number;
  flashEffectEnabled: boolean;
  isAutoDownloadEnabled?: boolean;
  isDownloadButtonEnabled?: boolean;
  isPrintButtonEnabled?: boolean;
  printPaperSize?: '4x6' | 'A4_portrait' | 'A4_landscape';
  printColorMode?: 'color' | 'grayscale';
  isPrintCopyInputEnabled?: boolean;
  printMaxCopies?: number;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeTitleColor?: string;
  welcomeSubtitleColor?: string;
  welcomeTitleFont?: string;
  isWelcomeTitleFontRandom?: boolean;
  welcomeSubtitleFont?: string;
  isWelcomeSubtitleFontRandom?: boolean;
  isWelcomeTextShadowEnabled?: boolean;
  welcomeBgType?: 'default' | 'color' | 'image' | 'camera';
  welcomeBgColor?: string;
  welcomeBgImageUrl?: string;
  welcomeBgZoom?: number;
  startButtonText?: string;
  startButtonBgColor?: string;
  startButtonTextColor?: string;
  isStartButtonShadowEnabled?: boolean;
  theme?: 'light' | 'dark';
  isPinLockEnabled?: boolean;
  fullscreenPin?: string;
  isStrictKioskMode?: boolean;
  isSessionCodeEnabled?: boolean;
  freePlayMaxTakes?: number;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  widthMM: number;
  heightMM: number;
  photoSlots: PhotoSlot[];
  orientation: 'portrait' | 'landscape';
  eventId?: string; // Tautan ke sebuah acara
}

// FIX: Added missing Event interface.
export interface Event {
  id: string;
  name: string;
  isArchived?: boolean;
  qrCodeImageUrl?: string;
  isQrCodeEnabled?: boolean;
}

// FIX: Added missing HistoryEntry interface.
export interface HistoryEntry {
  id: string;
  imageDataUrl: string; // base64 data URL
  timestamp: number;
  eventId: string;
  eventName: string;
}

// FIX: Added missing SessionKeyStatus enum.
export enum SessionKeyStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// FIX: Added missing SessionKey interface.
export interface SessionKey {
  id: string;
  code: string;
  status: SessionKeyStatus;
  createdAt: number;
  maxTakes: number;
  takesUsed: number;
  currentEventName?: string;
  progress?: string;
}
