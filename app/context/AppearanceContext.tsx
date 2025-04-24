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
import { Alert, Appearance, StatusBarStyle } from 'react-native';

// --- Import Dependent Types ---
// Ensure GridContext exists and exports this type
import { GridLayoutType } from './GridContext'; // Adjust path if needed

// --- Exported Types (for consumers and settings screens) ---
export type TextSizeType = 'small' | 'medium' | 'large';
export type ContrastModeType = 'default' | 'high-contrast-light' | 'high-contrast-dark';

// --- Storage Key ---
const DISPLAY_SETTINGS_STORAGE_KEY = '@Communify:displaySettings';

// --- Define Theme Structure ---
// This structure defines the colors available throughout the app via the context
export interface ThemeColors {
  isDark: boolean; // Flag indicating if the theme is derived from dark mode
  background: string; // Main screen background
  card: string; // Background for cards, modals, etc.
  text: string; // Primary text color
  textSecondary: string; // Secondary text color (e.g., descriptions, subtitles)
  primary: string; // Primary interactive color (buttons, active elements)
  primaryMuted: string; // Muted version of primary (e.g., active button background)
  secondary: string; // Secondary accent color (e.g., switch tracks)
  border: string; // Border color for cards, inputs, separators
  disabled: string; // Color for disabled elements/text
  white: string; // Pure white (for specific elements like header icons)
  black: string; // Pure black (for specific elements)
}

// --- Define Font Size Structure ---
// Defines named font sizes available via the context
export interface FontSizes {
    h1: number;
    h2: number;
    body: number;
    label: number;
    caption: number;
    button: number;
}

// --- Full Settings Structure (as stored in AsyncStorage) ---
// Represents the complete object saved, including non-appearance settings
interface FullDisplaySettingsData {
    layout: GridLayoutType;
    brightness: number; // Stored as 0-100
    brightnessLocked: boolean; // Lock state is also stored
    textSize: TextSizeType;
    darkModeEnabled: boolean;
    contrastMode: ContrastModeType;
}

// --- Settings managed directly by this context ---
// These are the settings that directly influence appearance
interface AppearanceSettings {
    darkModeEnabled: boolean;
    contrastMode: ContrastModeType;
    textSize: TextSizeType;
    brightness: number; // Stored as 0-100
}

// --- Context Props ---
// Defines the data and functions provided by the context consumer hook (useAppearance)
interface AppearanceContextProps {
    settings: AppearanceSettings; // The current appearance settings
    theme: ThemeColors; // The calculated theme colors based on settings
    fonts: FontSizes; // The calculated font sizes based on settings
    brightnessOverlayOpacity: number; // Calculated opacity for the brightness overlay (0 to 0.7)
    statusBarStyle: StatusBarStyle; // 'light-content' or 'dark-content'
    isLoadingAppearance: boolean; // Flag indicating if settings are being loaded initially
    updateAppearanceSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => Promise<void>; // Function to update a setting
}

// --- Default Values ---
// Initial state before loading from storage
const defaultAppearanceSettings: AppearanceSettings = {
    darkModeEnabled: Appearance.getColorScheme() === 'dark', // Default based on system
    contrastMode: 'default',
    textSize: 'medium',
    brightness: 50,
};
// Default structure for the entire object stored in AsyncStorage
const defaultFullDisplaySettingsData: FullDisplaySettingsData = {
    layout: 'standard', // Default layout
    brightness: 50,
    brightnessLocked: false, // Default lock state
    textSize: 'medium',
    darkModeEnabled: defaultAppearanceSettings.darkModeEnabled,
    contrastMode: 'default',
};

// --- Create Context ---
const AppearanceContext = createContext<AppearanceContextProps | undefined>(undefined);

// --- Custom Hook for easy consumption ---
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
    const base = 15; // Base body size for 'medium'
    return {
        h1: Math.round(base * 1.6 * scaleFactor),
        h2: Math.round(base * 1.3 * scaleFactor),
        body: Math.round(base * scaleFactor),
        label: Math.round(base * 0.95 * scaleFactor),
        caption: Math.round(base * 0.8 * scaleFactor),
        button: Math.round(base * 0.95 * scaleFactor),
    };
};


// --- Provider Component ---
export const AppearanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State for the appearance settings managed by this context
    const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
    // Loading state, true until settings are loaded from storage
    const [isLoadingAppearance, setIsLoadingAppearance] = useState(true);

    // Effect to load settings from AsyncStorage on initial mount
    useEffect(() => {
        let isMounted = true;
        console.log('AppearanceContext: Mounting and starting load...');

        const loadSettings = async () => {
            if (!isMounted) {
                console.log('AppearanceContext: Unmounted before load attempt start.');
                return;
            }
             // Ensure loading state is true at the beginning
            setIsLoadingAppearance(true);
            console.log('AppearanceContext: setIsLoadingAppearance(true)');

            try {
                console.log('AppearanceContext: Attempting to read from AsyncStorage...');
                const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
                console.log('AppearanceContext: AsyncStorage read complete. Value:', storedJson ? '<JSON Data>' : '<null>'); // Avoid logging large JSON

                if (!isMounted) {
                    console.log('AppearanceContext: Unmounted after AsyncStorage read.');
                    return;
                }

                if (storedJson) {
                    let loadedAppearanceSettings = defaultAppearanceSettings; // Default to defaults in case of parse error
                    try {
                        console.log('AppearanceContext: Attempting to parse JSON...');
                        const parsedFullSettings: Partial<FullDisplaySettingsData> = JSON.parse(storedJson);
                        console.log('AppearanceContext: JSON parsed successfully.');

                        // Validate and safely extract appearance settings from the potentially larger stored object
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
                        // Keep loadedAppearanceSettings as defaults
                        // Optionally remove corrupted data:
                        // await AsyncStorage.removeItem(DISPLAY_SETTINGS_STORAGE_KEY);
                    }
                    // Update state with loaded (or default) settings
                    setSettings(loadedAppearanceSettings);
                    console.log('AppearanceContext: State updated with settings:', loadedAppearanceSettings);

                } else {
                    // No settings found in storage, use defaults
                    console.log('AppearanceContext: No settings in storage, using defaults.');
                    setSettings(defaultAppearanceSettings);
                }
            } catch (e) {
                console.error("AppearanceContext: Failed to read display settings from AsyncStorage. Using defaults.", e);
                if (isMounted) {
                    setSettings(defaultAppearanceSettings); // Fallback on read error
                }
                Alert.alert("Load Error", "Could not load display settings."); // Inform user
            } finally {
                // CRITICAL: Ensure loading is set to false once done, if still mounted
                if (isMounted) {
                    setIsLoadingAppearance(false);
                    console.log('AppearanceContext: setIsLoadingAppearance(false) in finally block.');
                } else {
                     console.log('AppearanceContext: Unmounted before finally block.');
                }
            }
        };

        loadSettings();

        // Cleanup function to set isMounted to false when component unmounts
        return () => {
            isMounted = false;
            console.log('AppearanceContext: Unmounting.');
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Function to update a specific appearance setting ---
    // This updates the context state AND saves the *entire* settings object back to AsyncStorage
    const updateAppearanceSetting = useCallback(async <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
        // Create the new appearance settings based on the update
        const newAppearanceSettings = { ...settings, [key]: value };

        // Optimistically update the context state for immediate UI feedback
        setSettings(newAppearanceSettings);
        console.log(`AppearanceContext: Optimistically updated state for ${key}:`, value);

        try {
            // Load the existing full settings object from storage
            // It might contain non-appearance settings like layout, locks, etc.
            const storedJson = await AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);

            // Use full defaults as a base if nothing is stored yet or parsing fails
            let existingFullSettings: FullDisplaySettingsData = defaultFullDisplaySettingsData;
            if (storedJson) {
                try {
                    existingFullSettings = { ...defaultFullDisplaySettingsData, ...JSON.parse(storedJson) };
                } catch (parseError) {
                    console.error("AppearanceContext: Failed to parse existing settings before saving. Using defaults as base.", parseError);
                }
            }

            // Combine the updated appearance settings with the other existing settings
            const fullSettingsToSave: FullDisplaySettingsData = {
                ...existingFullSettings, // Preserve layout, brightnessLocked etc.
                ...newAppearanceSettings // Overwrite with the updated appearance values
            };

            // Save the complete object back to AsyncStorage
            await AsyncStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(fullSettingsToSave));
            console.log('AppearanceContext: Successfully saved full settings to storage for key:', key);

        } catch (e) {
            console.error("AppearanceContext: Failed to save setting to storage for key:", key, e);
             Alert.alert("Save Error", `Could not save display setting.`);
            // OPTIONAL: Revert optimistic update on save failure
            // To revert, you'd need to store the 'previous' state before setSettings
            // Example: setSettings(previousSettings); // Requires managing previous state
        }
    }, [settings]); // Depend on current settings state for merging

    // --- Calculate Derived Values ---
    // Memoize theme, fonts, etc., so they only recalculate when settings change
    const theme = useMemo(() => getTheme(settings.darkModeEnabled, settings.contrastMode), [settings.darkModeEnabled, settings.contrastMode]);
    const fonts = useMemo(() => getFontSizes(settings.textSize), [settings.textSize]);
    const brightnessOverlayOpacity = useMemo(() => (settings.brightness / 100) * 0.7, [settings.brightness]); // 0% to 70% opacity
    const statusBarStyle: StatusBarStyle = useMemo(() => (theme.isDark ? 'light-content' : 'dark-content'), [theme.isDark]);

    // --- Context Value ---
    // Assemble the value provided to consuming components
    const value: AppearanceContextProps = {
        settings,
        theme,
        fonts,
        brightnessOverlayOpacity,
        statusBarStyle,
        isLoadingAppearance, // Provide loading status
        updateAppearanceSetting, // Provide update function
    };

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
};