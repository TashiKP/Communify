// src/styles/typography.ts
import { Platform } from 'react-native';
import { FontSizes, ThemeColors } from '../context/AppearanceContext'; // Adjust path if needed

// --- Constants ---
export const DZONGKHA_FONT_FAMILY = 'Jomolhari-Regular'; // Or 'Jomolhari' - VERIFY THIS NAME

// --- Dzongkha Typography Adjustments ---
// These are multipliers relative to the base FontSizes from your AppearanceContext
// You will need to TUNE these values by observing your UI in Dzongkha.
export const DZONGKHA_TYPOGRAPHY_ADJUSTMENTS = {
  // type: { fontSizeMultiplier, lineHeightMultiplier }
  title:    { fontSizeMultiplier: 0.9,  lineHeightMultiplier: 2.4 },
  h1:       { fontSizeMultiplier: 0.85, lineHeightMultiplier: 2.5 },
  h2:       { fontSizeMultiplier: 0.9,  lineHeightMultiplier: 2.2 },
  body:     { fontSizeMultiplier: 0.95, lineHeightMultiplier: 2.8 },
  label:    { fontSizeMultiplier: 0.95, lineHeightMultiplier: 2.0 },
  caption:  { fontSizeMultiplier: 1,    lineHeightMultiplier: 2.0 },
  button:   { fontSizeMultiplier: 0.9,  lineHeightMultiplier: 1.8 }, // Added for buttons
};

// --- Helper Function to Get Language-Specific Text Styles ---
interface TextStyleProps {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  // Add other common text style properties if needed
}

export const getLanguageSpecificTextStyle = (
  type: keyof typeof DZONGKHA_TYPOGRAPHY_ADJUSTMENTS, // 'title', 'h1', 'body', etc.
  baseFontSizes: FontSizes,                           // From useAppearance().fonts
  currentLanguage: string                             // From i18n.language
): TextStyleProps => {
  const isDzo = currentLanguage === 'dzo';
  const baseFontSize = baseFontSizes[type as keyof FontSizes] || baseFontSizes.body; // Fallback to body size

  if (isDzo) {
    const adjustment = DZONGKHA_TYPOGRAPHY_ADJUSTMENTS[type];
    const finalFontSize = baseFontSize * adjustment.fontSizeMultiplier;
    return {
      fontFamily: DZONGKHA_FONT_FAMILY,
      fontSize: finalFontSize,
      lineHeight: finalFontSize * adjustment.lineHeightMultiplier,
    };
  } else {
    // Default English line height (can be adjusted)
    return {
      fontSize: baseFontSize,
      lineHeight: baseFontSize * 1.4, // Or 1.5, adjust as needed for English
    };
  }
};