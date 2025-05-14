// src/context/AppearanceContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useMemo,
    useCallback,
    FC, // Use FC for component type
    useRef
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, StatusBarStyle } from 'react-native';

// --- Import Dependent Types (Ensure path is correct if GridContext is in a different folder) ---
// import { GridLayoutType } from './GridContext'; // Only needed if FullDisplaySettingsData uses it

// --- Exported Types ---
export type TextSizeType = 'small' | 'medium' | 'large';
export type ContrastModeType = 'default' | 'high-contrast-light' | 'high-contrast-dark';
export type GridLayoutType = 'simple' | 'standard' | 'dense'; // Re-added if FullDisplaySettingsData needs it

// --- Storage Key ---
const DISPLAY_SETTINGS_STORAGE_KEY = '@Communify:displaySettings';

// --- Define Theme Structure ---
export interface ThemeColors {
  isDark: boolean;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryMuted: string;
  primaryDark?: string; // ADDED primaryDark (optional if not all themes define it explicitly)
  secondary: string;
  border: string;
  disabled: string;
  white: string;
  black: string;
}

// --- Define Font Size Structure ---
export interface FontSizes {
    h1: number;
    h2: number;
    body: number;
    label: number;
    caption: number;
    button: number;
}

// --- Full Settings Structure (as stored in AsyncStorage) ---
// This includes settings managed by other contexts but saved together
interface FullDisplaySettingsData {
    layout: GridLayoutType; // From GridContext
    brightness: number;      // From AppearanceContext
    brightnessLocked: boolean; // Potentially from a future setting
    textSize: TextSizeType;   // From AppearanceContext
    darkModeEnabled: boolean; // From AppearanceContext
    contrastMode: ContrastModeType; // From AppearanceContext
}

// --- Settings managed directly by this AppearanceContext ---
interface AppearanceSettings {
    darkModeEnabled: boolean;
    contrastMode: ContrastModeType;
    textSize: TextSizeType;
    brightness: number; // Percentage 0-100
}

// --- Context Props ---
interface AppearanceContextProps {
    settings: AppearanceSettings;
    theme: ThemeColors;
    fonts: FontSizes;
    brightnessOverlayOpacity: number; // Calculated from brightness (0 to 0.7 for overlay)
    statusBarStyle: StatusBarStyle;
    isLoadingAppearance: boolean;
    updateAppearanceSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => Promise<void>;
}

// --- Default Values ---
const defaultAppearanceSettings: AppearanceSettings = {
    darkModeEnabled: Appearance.getColorScheme() === 'dark',
    contrastMode: 'default',
    textSize: 'medium',
    brightness: 100, // Default to full brightness (no overlay)
};

// Default for the entire stored object, including fields from other contexts
const defaultFullDisplaySettingsData: FullDisplaySettingsData = {
    layout: 'standard', // Default from GridContext
    brightness: defaultAppearanceSettings.brightness,
    brightnessLocked: false,
    textSize: defaultAppearanceSettings.textSize,
    darkModeEnabled: defaultAppearanceSettings.darkModeEnabled,
    contrastMode: defaultAppearanceSettings.contrastMode,
};

// --- Create Context ---
const AppearanceContext = createContext<AppearanceContextProps | undefined>(undefined);

// --- Custom Hook ---
export const useAppearance = (): AppearanceContextProps => {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
};

// --- Theme Calculation Logic ---
const getTheme = (isDarkSystem: boolean, contrast: ContrastModeType): ThemeColors => {
    // Base palette
    const base = {
        blue: '#0077b6',        // Primary Blue
        lightBlue: '#90e0ef',   // Lighter Blue / Accent
        skyBlue: '#caf0f8',     // Very Light Blue / Backgrounds
        navy: '#03045e',        // Dark Blue
        darkNavy: '#023047',    // Very Dark Blue
        white: '#ffffff',
        black: '#000000',
        trueBlack: '#000000',   // For high contrast dark text
        trueWhite: '#ffffff',   // For high contrast light text
        darkText: '#212529',    // Standard dark text
        lightText: '#f8f9fa',   // Standard light text
        grey1: '#343a40',       // Darkest Grey (borders on dark)
        grey2: '#6c757d',       // Mid-Dark Grey (secondary text)
        grey3: '#adb5bd',       // Mid-Light Grey (disabled, borders on light)
        grey4: '#ced4da',       // Light Grey
        grey5: '#e9ecef',       // Lighter Grey (borders)
        grey6: '#f8f9fa',       // Lightest Grey (backgrounds)
        yellow: '#FFFF00',      // High Contrast Accent
        cyan: '#00FFFF',        // High Contrast Accent
        magenta: '#FF00FF',    // High Contrast Accent
        green: '#28a745',       // Success
        red: '#dc3545',         // Error
    };

    if (contrast === 'high-contrast-dark') {
        return {
            isDark: true,
            background: base.black,
            card: base.black, // Often same as background for max contrast
            text: base.yellow,
            textSecondary: base.cyan,
            primary: base.cyan,
            primaryMuted: '#008080', // Darker Cyan
            primaryDark: '#005050',  // Even Darker Cyan
            secondary: base.magenta,
            border: base.white, // High contrast border
            disabled: base.grey2,
            white: base.trueWhite,
            black: base.trueBlack,
        };
    }
    if (contrast === 'high-contrast-light') {
        return {
            isDark: false,
            background: base.white,
            card: base.white,
            text: base.black,
            textSecondary: '#333333', // Darker secondary text
            primary: '#0000FF',    // Strong Blue
            primaryMuted: '#6666FF',
            primaryDark: '#0000AA',
            secondary: '#FF0000',   // Strong Red
            border: base.black, // High contrast border
            disabled: base.grey3,
            white: base.trueWhite,
            black: base.trueBlack,
        };
    }
    if (isDarkSystem) { // Default Dark Mode
        return {
            isDark: true,
            background: base.navy,      // Dark background
            card: base.darkNavy,        // Slightly lighter card
            text: base.grey6,           // Light text
            textSecondary: base.grey3,
            primary: base.lightBlue,
            primaryMuted: '#003f5c', // Muted version of lightBlue for dark theme
            primaryDark: '#002c40',  // Darker version
            secondary: base.blue,
            border: base.grey1,         // Dark border
            disabled: base.grey2,
            white: base.trueWhite,      // Pure white for specific elements
            black: base.trueBlack,      // Pure black
        };
    }
    // Default Light Mode
    return {
        isDark: false,
        background: base.white,    // Light, airy background
        card: base.white,
        text: base.darkText,
        textSecondary: base.grey2,
        primary: base.blue,
        primaryMuted: '#61a5c2', // Muted version of blue for light theme
        primaryDark: base.navy,    // Darker blue for accents or safeArea
        secondary: base.lightBlue,
        border: base.grey4,         // Lighter border
        disabled: base.grey3,
        white: base.trueWhite,
        black: base.trueBlack,
    };
};


// --- Font Size Calculation ---
const getFontSizes = (size: TextSizeType): FontSizes => {
    const scaleFactor = size === 'small' ? 0.88 : size === 'medium' ? 1.0 : 1.12;
    const base = Platform.OS === 'ios' ? 17 : 16; // Slightly larger base for iOS
    return {
        h1: Math.round(base * 1.7 * scaleFactor),
        h2: Math.round(base * 1.4 * scaleFactor),
        body: Math.round(base * scaleFactor),
        label: Math.round(base * 0.9 * scaleFactor),
        caption: Math.round(base * 0.75 * scaleFactor),
        button: Math.round(base * 0.95 * scaleFactor),
    };
};

// --- Provider Component ---
export const AppearanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
    const [isLoadingAppearance, setIsLoadingAppearance] = useState(true);
    const isMountedRef = useRef(true); // Ref to track mount status

    useEffect(() => {
        isMountedRef.current = true;
        const loadSettings = async () => {
            try {
                const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
                if (!isMountedRef.current) return;

                if (storedJson) {
                    let loadedAppearanceSettings = { ...defaultAppearanceSettings }; // Start with defaults
                    try {
                        const parsedFullSettings: Partial<FullDisplaySettingsData> = JSON.parse(storedJson);
                        
                        const validTextSizes: TextSizeType[] = ['small', 'medium', 'large'];
                        const validContrastModes: ContrastModeType[] = ['default', 'high-contrast-light', 'high-contrast-dark'];

                        // Carefully extract and validate each setting relevant to AppearanceContext
                        if (typeof parsedFullSettings.darkModeEnabled === 'boolean') {
                            loadedAppearanceSettings.darkModeEnabled = parsedFullSettings.darkModeEnabled;
                        }
                        if (parsedFullSettings.contrastMode && validContrastModes.includes(parsedFullSettings.contrastMode)) {
                            loadedAppearanceSettings.contrastMode = parsedFullSettings.contrastMode;
                        }
                        if (parsedFullSettings.textSize && validTextSizes.includes(parsedFullSettings.textSize)) {
                            loadedAppearanceSettings.textSize = parsedFullSettings.textSize;
                        }
                        if (typeof parsedFullSettings.brightness === 'number' && parsedFullSettings.brightness >= 0 && parsedFullSettings.brightness <= 100) {
                            loadedAppearanceSettings.brightness = parsedFullSettings.brightness;
                        }
                        // console.log('AppearanceContext: Loaded settings from storage:', loadedAppearanceSettings);
                    } catch (parseError) {
                        console.error("AppearanceContext: Failed to parse stored display settings. Using defaults.", parseError);
                        // loadedAppearanceSettings remains defaultAppearanceSettings
                    }
                    if (isMountedRef.current) setSettings(loadedAppearanceSettings);
                } else {
                    // console.log('AppearanceContext: No settings in storage, using defaults.');
                    if (isMountedRef.current) setSettings(defaultAppearanceSettings);
                }
            } catch (e) {
                console.error("AppearanceContext: Failed to read display settings. Using defaults.", e);
                if (isMountedRef.current) setSettings(defaultAppearanceSettings);
            } finally {
                if (isMountedRef.current) setIsLoadingAppearance(false);
            }
        };

        loadSettings();
        return () => { isMountedRef.current = false; };
    }, []);

    const updateAppearanceSetting = useCallback(async <K extends keyof AppearanceSettings>(
        key: K,
        value: AppearanceSettings[K]
    ) => {
        const newAppearanceSettings = { ...settings, [key]: value };
        setSettings(newAppearanceSettings); // Optimistic update

        try {
            const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
            let existingFullSettings: FullDisplaySettingsData = { ...defaultFullDisplaySettingsData };
            if (storedJson) {
                try {
                    existingFullSettings = { ...defaultFullDisplaySettingsData, ...JSON.parse(storedJson) };
                } catch (parseError) {
                    console.error("AppearanceContext: Corrupted existing settings before saving. Starting from defaults for save.", parseError);
                }
            }
            // Merge updated appearance settings into the full settings structure
            const fullSettingsToSave: FullDisplaySettingsData = {
                ...existingFullSettings, // Preserves other settings like layout, brightnessLocked
                darkModeEnabled: newAppearanceSettings.darkModeEnabled,
                contrastMode: newAppearanceSettings.contrastMode,
                textSize: newAppearanceSettings.textSize,
                brightness: newAppearanceSettings.brightness,
            };
            await AsyncStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(fullSettingsToSave));
            // console.log('AppearanceContext: Settings saved to storage for key:', key);
        } catch (e) {
            console.error("AppearanceContext: Failed to save setting to storage for key:", key, e);
        }
    }, [settings]); // Depends on current settings to merge correctly

    const theme = useMemo(() => getTheme(settings.darkModeEnabled, settings.contrastMode), [
        settings.darkModeEnabled,
        settings.contrastMode,
    ]);
    const fonts = useMemo(() => getFontSizes(settings.textSize), [settings.textSize]);
    // Brightness overlay: 0% brightness = 0.7 opacity (very dark), 100% brightness = 0 opacity (no overlay)
    const brightnessOverlayOpacity = useMemo(() => (1 - settings.brightness / 100) * 0.7, [
        settings.brightness,
    ]);
    const statusBarStyle: StatusBarStyle = useMemo(() => (theme.isDark ? 'light-content' : 'dark-content'), [
        theme.isDark,
    ]);

    const contextValue: AppearanceContextProps = useMemo(() => ({
        settings,
        theme,
        fonts,
        brightnessOverlayOpacity,
        statusBarStyle,
        isLoadingAppearance,
        updateAppearanceSetting,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [settings, theme, fonts, brightnessOverlayOpacity, statusBarStyle, isLoadingAppearance, updateAppearanceSetting]);
    // updateAppearanceSetting is stable due to useCallback with 'settings' as dependency,
    // which is already in this useMemo's dependency array.

    return (
        <AppearanceContext.Provider value={contextValue}>
            {children}
        </AppearanceContext.Provider>
    );
};