

export enum AppState {
  WELCOME,
  TUTORIAL, // New: Tutorial Screen
  KEY_CODE_ENTRY,
  PRICE_SELECTION, // New: Selection Price/Package
  PAYMENT_SHOW, // New: Show QRIS
  PAYMENT_VERIFICATION, // New: Scan Proof
  EVENT_SELECTION,
  TEMPLATE_SELECTION,
  SETTINGS,
  MANAGE_EVENTS,
  MANAGE_SESSIONS,
  MANAGE_REVIEWS,
  EDIT_TEMPLATE_METADATA,
  EDIT_TEMPLATE_LAYOUT,
  CAPTURE,
  RETAKE_PREVIEW,
  RATING,
  PREVIEW,
  HISTORY,
  ONLINE_HISTORY,
  MANAGE_TENANTS,
}

export interface PhotoSlot {
  id: number;
  inputId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface VoxelPoint {
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface FloatingObject {
  id: string;
  type: 'built-in-camera' | 'custom-voxel';
  name: string;
  voxelData?: string; // JSON string of VoxelPoint[]
  isVisible: boolean;
  
  // Position (Screen %)
  positionX: number;
  positionY: number;
  
  // Appearance
  scale: number;
  
  // Static Rotation (Degrees)
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  
  // Animation
  isSpinning: boolean;
  spinSpeed: number; // 0.001 to 0.1
}

export interface PriceList {
  id: string;
  name: string;
  description: string;
  price: number;
  maxTakes: number; // Number of sessions granted
}

export interface PaymentEntry {
  id: string;
  userName: string;
  priceListId: string;
  priceListName: string;
  amount: number;
  status: 'pending' | 'verified' | 'failed';
  timestamp: number;
  proofHash?: string; // To prevent double spending
  whatsappNumber?: string; // New: Stores user whatsapp number for manual sending
}

export interface Settings {
  countdownDuration: number;
  flashEffectEnabled: boolean;
  // Camera Settings
  cameraSourceType?: 'default' | 'ip_camera';
  cameraDeviceId?: string; // New: ID for specific device selection (USB/HDMI Capture)
  ipCameraUrl?: string;
  ipCameraUseProxy?: boolean;
  
  isPinLockEnabled?: boolean;
  fullscreenPin?: string;
  isStrictKioskMode?: boolean;
  
  // Logic Flow Settings
  isSessionCodeEnabled?: boolean;
  isPaymentEnabled?: boolean; // New: Toggle for Payment Mode
  
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
  
  // Floating 3D Objects (Replaces old single camera settings)
  floatingObjects?: FloatingObject[];
  
  // Payment Settings
  priceLists?: PriceList[];
  qrisImageUrl?: string;

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
  // New Online History Button Settings
  isOnlineHistoryButtonIconEnabled?: boolean;
  onlineHistoryButtonText?: string;
  isOnlineHistoryButtonFillEnabled?: boolean;
  onlineHistoryButtonFillColor?: string;
  onlineHistoryButtonTextColor?: string;
  isOnlineHistoryButtonStrokeEnabled?: boolean;
  onlineHistoryButtonStrokeColor?: string;
  isOnlineHistoryButtonShadowEnabled?: boolean;
  // Retake Settings
  maxRetakes?: number;
  // Review Settings
  isReviewSliderEnabled?: boolean;
  reviewSliderMaxDescriptionLength?: number;
  isReviewForFreebieEnabled?: boolean;
  reviewFreebieTakesCount?: number;
  // Rating Screen Customization
  ratingScreenTitle?: string;
  ratingScreenSubtitle?: string;
  ratingScreenFreebieTitle?: string;
  ratingScreenFreebieDescription?: string; // e.g., "Give a 5-star review for {count} free takes!"
  ratingScreenNameLabel?: string;
  ratingScreenNamePlaceholder?: string;
  ratingScreenRatingLabel?: string;
  ratingScreenCommentLabel?: string;
  ratingScreenCommentPlaceholder?: string;
  ratingScreenSubmitButtonText?: string;
  ratingScreenSkipButtonText?: string;
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
  qrCodeValue?: string; // Changed from qrCodeImageUrl: Stores the link/text content
  isQrCodeEnabled?: boolean;
  templateOrder?: string[]; // Menyimpan urutan ID template
}

export interface HistoryEntry {
  id: string;
  eventId: string;
  eventName: string;
  imageDataUrl: string;
  timestamp: number;
}

export interface OnlineHistoryEntry {
  nama: string;
  url: string;
  waktu: string;
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
  hasBeenReviewed?: boolean;
  isUnlimited?: boolean; // New: Unlimited / Persistent mode
  isGenerated?: boolean; // New: Generated from an unlimited key
  originalCode?: string; // New: Reference to original code if generated
}

export interface Review {
    id: string;
    eventId: string;
    eventName: string;
    userName: string;
    rating: number; // 1 to 5
    description: string;
    timestamp: number;
}

export interface Tenant {
  id: string;
  username: string;
  password?: string; // NOTE: Storing plaintext passwords is not secure. This is for exercise purposes.
  path: string; // The unique URL path for this tenant, e.g., "client-a"
  isActive: boolean;
  createdAt: number;
}