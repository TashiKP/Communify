// app/constants/colors.ts

import { Colors as RNDefaultColors } from "react-native/Libraries/NewAppScreen"; // Renamed to avoid conflict

export const PRIMARY_COLOR = '#0077b6';
export const SECONDARY_COLOR = '#00b4d8';
export const BACKGROUND_COLOR = '#f8f9fa';
export const WHITE_COLOR = '#ffffff';
export const TEXT_COLOR_PRIMARY = '#212529'; // For main text
export const TEXT_COLOR_SECONDARY = '#495057'; // For subtitles, labels, darkGrey
export const PLACEHOLDER_COLOR = '#6c757d';
export const ERROR_COLOR_TEXT = '#721c24'; // For error message text
export const ERROR_COLOR_BACKGROUND = '#f8d7da'; // For error message background
export const ERROR_COLOR_BORDER = '#f5c6cb'; // For error message border
export const BORDER_COLOR_MEDIUM = '#ced4da'; // For input borders etc., mediumGrey
export const INPUT_BACKGROUND_COLOR = WHITE_COLOR; // Input fields are white

export const DEFAULT_BACKGROUND_COLOR = BACKGROUND_COLOR; // You can use your existing BACKGROUND_COLOR or a different one
export const LOADER_COLOR = PRIMARY_COLOR;
export const ERROR_FALLBACK_BACKGROUND_COLOR = '#ffebee'; // A very light red or off-white
export const ERROR_FALLBACK_TEXT_COLOR = '#c62828';       // A dark, readable red for main error text
export const ERROR_FALLBACK_MESSAGE_COLOR = '#d32f2f';  // A slightly less dark red for messages
export const ERROR_DETAILS_COLOR = '#b71c1c';     

// New additions from SigninTwo
export const BORDER_COLOR_LIGHT = '#e9ecef'; // Was lightGrey, for header border
export const BACKGROUND_SELECTED_LIGHT = '#e7f5ff'; // Was selectedTint, for selected option cards

// Loader colors
export const LOADER_COLOR_PRIMARY = WHITE_COLOR; // Loader on primary button
export const LOADER_COLOR_SECONDARY = PRIMARY_COLOR; // If you have a loader elsewhere

// Button colors
export const BUTTON_PRIMARY_BACKGROUND = PRIMARY_COLOR;
export const BUTTON_PRIMARY_TEXT = WHITE_COLOR;
export const BUTTON_DISABLED_BACKGROUND = BORDER_COLOR_MEDIUM; // Using mediumGrey for disabled

// Link colors
export const LINK_TEXT_COLOR = PRIMARY_COLOR;

// Status bar
export const STATUS_BAR_BACKGROUND_LIGHT = BACKGROUND_COLOR; // For screens with light background
export const STATUS_BAR_BACKGROUND_DARK = PRIMARY_COLOR; // For screens with dark background (like Login)

// Login Screen Specific Colors (examples, adjust based on your actual design values)
export const BACKGROUND_COLOR_LOGIN_SCREEN = '#f0f9ff';
export const GRADIENT_START_LOGIN = '#0066a3';
export const GRADIENT_END_LOGIN = '#0099c6';
export const PRIMARY_COLOR_LOGIN_ACCENT = '#0077b6'; // The blue used for titles, links
export const SECONDARY_COLOR_LOGIN_ACCENT = '#00b4d8'; // The blue for spectrum line
export const TEXT_COLOR_SLOGAN_LOGIN = 'rgba(255,255,255,0.9)';
export const TEXT_COLOR_SUBTITLE_LOGIN = '#343a40';
export const INPUT_BACKGROUND_LOGIN = '#e6f0fa';
export const PLACEHOLDER_COLOR_LOGIN = '#adb5bd';
export const BORDER_COLOR_SUBTLE_LOGIN = '#e0e0e0';
export const SHADOW_COLOR_LOGIN = '#000';
export const TEXT_COLOR_INPUT_LOGIN = '#343a40';
// Corrected to use own constants:
export const ERROR_BACKGROUND_LOGIN = ERROR_COLOR_BACKGROUND;
export const ERROR_TEXT_LOGIN = ERROR_COLOR_TEXT;
export const ERROR_BORDER_LOGIN = ERROR_COLOR_BORDER;
export const BUTTON_PRIMARY_BACKGROUND_LOGIN = PRIMARY_COLOR_LOGIN_ACCENT;
export const BUTTON_PRIMARY_TEXT_LOGIN = WHITE_COLOR;
export const BUTTON_DISABLED_BACKGROUND_LOGIN = SECONDARY_COLOR_LOGIN_ACCENT; // Or a grey
export const TEXT_COLOR_FOOTER_LOGIN = TEXT_COLOR_INPUT_LOGIN;
export const LOADER_COLOR_ON_PRIMARY_BUTTON = WHITE_COLOR;