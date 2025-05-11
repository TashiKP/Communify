// src/context/AppearanceContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useMemo,
    useCallback
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, StatusBarStyle /*, Alert */ } from 'react-native'; // Alert commented out for now

// --- Import Dependent Types ---
import { GridLayoutType } from './GridContext'; // Adjust path if needed

// --- Exported Types ---
export type TextSizeType = 'small' | 'medium' | 'large';
export type ContrastModeType = 'default' | 'high-contrast-light' | 'high-contrast-dark';

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
interface FullDisplaySettingsData {
    layout: GridLayoutType;
    brightness: number;
    brightnessLocked: boolean;
    textSize: TextSizeType;
    darkModeEnabled: boolean;
    contrastMode: ContrastModeType;
}

// --- Settings managed directly by this context ---
interface AppearanceSettings {
    darkModeEnabled: boolean;
    contrastMode: ContrastModeType;
    textSize: TextSizeType;
    brightness: number;
}

// --- Context Props ---
interface AppearanceContextProps {
    settings: AppearanceSettings;
    theme: ThemeColors;
    fonts: FontSizes;
    brightnessOverlayOpacity: number;
    statusBarStyle: StatusBarStyle;
    isLoadingAppearance: boolean;
    updateAppearanceSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => Promise<void>;
}

// --- Default Values ---
const defaultAppearanceSettings: AppearanceSettings = {
    darkModeEnabled: Appearance.getColorScheme() === 'dark',
    contrastMode: 'default',
    textSize: 'medium',
    brightness: 50,
};
const defaultFullDisplaySettingsData: FullDisplaySettingsData = {
    layout: 'standard',
    brightness: 50,
    brightnessLocked: false,
    textSize: 'medium',
    darkModeEnabled: defaultAppearanceSettings.darkModeEnabled,
    contrastMode: 'default',
};

// --- Create Context ---
const AppearanceContext = createContext<AppearanceContextProps | undefined>(undefined);

// --- Custom Hook ---
export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
};

// --- Theme Calculation Logic ---
const getTheme = (isDark: boolean, contrast: ContrastModeType): ThemeColors => {
    const base = { blue: '#0077b6', lightBlue: '#90e0ef', white: '#ffffff', black: '#000000', darkText: '#212529', lightText: '#f8f9fa', grey1: '#343a40', grey2: '#6c757d', grey3: '#adb5bd', grey4: '#ced4da', grey5: '#e9ecef', grey6: '#f8f9fa', yellow: '#FFFF00', cyan: '#00FFFF', magenta: '#FF00FF' };
    if (contrast === 'high-contrast-dark') return { isDark: true, background: base.black, card: base.black, text: base.yellow, textSecondary: base.cyan, primary: base.cyan, primaryMuted: '#004444', secondary: base.magenta, border: base.white, disabled: base.grey2, white: base.white, black: base.black };
    if (contrast === 'high-contrast-light') return { isDark: false, background: base.white, card: base.white, text: base.black, textSecondary: '#505050', primary: '#0000FF', primaryMuted: '#ccccff', secondary: '#FF0000', border: base.black, disabled: base.grey3, white: base.white, black: base.black };
    if (isDark) return { isDark: true, background: '#121212', card: '#1e1e1e', text: base.grey6, textSecondary: base.grey3, primary: base.lightBlue, primaryMuted: '#2a4a5c', secondary: base.blue, border: base.grey1, disabled: base.grey2, white: base.white, black: base.black };
    return { isDark: false, background: base.grey6, card: base.white, text: base.darkText, textSecondary: base.grey2, primary: base.blue, primaryMuted: '#e7f5ff', secondary: base.lightBlue, border: base.grey5, disabled: base.grey3, white: base.white, black: base.black };
};

// --- Font Size Calculation ---
const getFontSizes = (size: TextSizeType): FontSizes => {
    const scaleFactor = size === 'small' ? 0.85 : size === 'medium' ? 1.0 : 1.15;
    const base = 15;
    return { h1: Math.round(base * 1.6 * scaleFactor), h2: Math.round(base * 1.3 * scaleFactor), body: Math.round(base * scaleFactor), label: Math.round(base * 0.95 * scaleFactor), caption: Math.round(base * 0.8 * scaleFactor), button: Math.round(base * 0.95 * scaleFactor) };
};

// --- Provider Component ---
export const AppearanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
    const [isLoadingAppearance, setIsLoadingAppearance] = useState(true);

    useEffect(() => {
        let isMounted = true;
        console.log('AppearanceContext: Mounting and starting load...');

        const loadSettings = async () => {
            console.log('AppearanceContext: loadSettings invoked.');
            try {
                console.log('AppearanceContext: Attempting to read from AsyncStorage...');
                const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
                
                if (!isMounted) {
                    console.log('AppearanceContext: Unmounted after AsyncStorage.getItem.');
                    return; 
                }
                console.log('AppearanceContext: AsyncStorage read complete. Value:', storedJson ? '<JSON Data>' : '<null>');

                if (storedJson) {
                    let loadedAppearanceSettings = defaultAppearanceSettings;
                    try {
                        console.log('AppearanceContext: Attempting to parse JSON...');
                        const parsedFullSettings: Partial<FullDisplaySettingsData> = JSON.parse(storedJson);
                        console.log('AppearanceContext: JSON parsed successfully.');

                        const validTextSizes: TextSizeType[] = ['small', 'medium', 'large'];
                        const validContrastModes: ContrastModeType[] = ['default', 'high-contrast-light', 'high-contrast-dark'];

                        loadedAppearanceSettings = {
                            darkModeEnabled: typeof parsedFullSettings.darkModeEnabled === 'boolean' ? parsedFullSettings.darkModeEnabled : defaultAppearanceSettings.darkModeEnabled,
                            contrastMode: validContrastModes.includes(parsedFullSettings.contrastMode as any) ? parsedFullSettings.contrastMode! : defaultAppearanceSettings.contrastMode,
                            textSize: validTextSizes.includes(parsedFullSettings.textSize as any) ? parsedFullSettings.textSize! : defaultAppearanceSettings.textSize,
                            brightness: (typeof parsedFullSettings.brightness === 'number' && parsedFullSettings.brightness >= 0 && parsedFullSettings.brightness <= 100) ? parsedFullSettings.brightness : defaultAppearanceSettings.brightness,
                        };
                    } catch (parseError) {
                        console.error("AppearanceContext: Failed to parse display settings JSON. Using defaults.", parseError);
                    }

                    if (!isMounted) {
                        console.log('AppearanceContext: Unmounted before setting loaded settings.');
                        return;
                    }
                    setSettings(loadedAppearanceSettings);
                    console.log('AppearanceContext: State updated with settings:', loadedAppearanceSettings);
                } else {
                    console.log('AppearanceContext: No settings in storage, using defaults.');
                    if (!isMounted) {
                        console.log('AppearanceContext: Unmounted before setting default settings.');
                        return;
                    }
                    setSettings(defaultAppearanceSettings);
                }
            } catch (e) {
                console.error("AppearanceContext: Failed to read/process display settings. Using defaults.", e);
                if (isMounted) {
                    setSettings(defaultAppearanceSettings);
                }
                // console.warn("AppearanceContext Load Error: Could not load display settings."); // Using console.warn instead of Alert for debugging
            } finally {
                if (isMounted) {
                    setIsLoadingAppearance(false);
                    console.log('AppearanceContext: setIsLoadingAppearance(false) in finally block.');
                } else {
                     console.log('AppearanceContext: Unmounted, isLoadingAppearance not set to false by finally.');
                }
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
            console.log('AppearanceContext: Unmounting.');
        };
    }, []);

    const updateAppearanceSetting = useCallback(async <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
        const newAppearanceSettings = { ...settings, [key]: value };
        setSettings(newAppearanceSettings); 
        console.log(`AppearanceContext: Optimistically updated state for ${key}:`, value);

        try {
            const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
            let existingFullSettings: FullDisplaySettingsData = defaultFullDisplaySettingsData; // Base defaults
            if (storedJson) {
                try {
                    // Merge stored with defaults to ensure all keys from FullDisplaySettingsData are present
                    existingFullSettings = { ...defaultFullDisplaySettingsData, ...JSON.parse(storedJson) };
                } catch (parseError) {
                    console.error("AppearanceContext: Failed to parse existing settings before saving. Using defaults as base.", parseError);
                    // existingFullSettings remains defaultFullDisplaySettingsData
                }
            }
            // Corrected typo here:
            const fullSettingsToSave: FullDisplaySettingsData = {
                ...existingFullSettings, // Preserves other settings like layout, brightnessLocked
                ...newAppearanceSettings // Overwrites with the updated appearance values
            };
            await AsyncStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(fullSettingsToSave));
            console.log('AppearanceContext: Successfully saved full settings to storage for key:', key);
        } catch (e) {
            console.error("AppearanceContext: Failed to save setting to storage for key:", key, e);
            // console.warn(`AppearanceContext Save Error: Could not save ${key}.`); // Using console.warn instead of Alert
        }
    }, [settings]);

    const theme = useMemo(() => getTheme(settings.darkModeEnabled, settings.contrastMode), [settings.darkModeEnabled, settings.contrastMode]);
    const fonts = useMemo(() => getFontSizes(settings.textSize), [settings.textSize]);
    const brightnessOverlayOpacity = useMemo(() => (settings.brightness / 100) * 0.7, [settings.brightness]);
    const statusBarStyle: StatusBarStyle = useMemo(() => (theme.isDark ? 'light-content' : 'dark-content'), [theme.isDark]);

    const value: AppearanceContextProps = {
        settings,
        theme,
        fonts,
        brightnessOverlayOpacity,
        statusBarStyle,
        isLoadingAppearance,
        updateAppearanceSetting,
    };

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
};