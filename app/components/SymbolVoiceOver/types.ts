export interface VoiceSettingData {
  pitch: number;
  speed: number;
  volume: number;
  pitchLocked: boolean;
  speedLocked: boolean;
  volumeLocked: boolean;
  selectedVoiceId: string | null;
  highlightWord: boolean;
  speakPunctuation: boolean;
}

export interface TtsVoice {
  id: string;
  name: string;
  language: string;
  quality?: number;
  latency?: number;
  networkConnectionRequired?: boolean;
  notInstalled?: boolean;
}

export interface SymbolVoiceOverScreenProps {
  initialSettings: VoiceSettingData;
  onSave: (settings: VoiceSettingData) => Promise<void> | void;
  onClose: () => void;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  disabled: string;
  white: string;
  isDark: boolean;
}

export interface FontSizes {
  h1: number;
  h2: number; // Required to match AppearanceContext
  body: number; // Required
  label: number; // Required
  caption: number;
  button: number; // Adjust to buttonts if that's the actual name
}
