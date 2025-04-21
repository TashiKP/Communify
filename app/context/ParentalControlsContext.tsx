import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
export type AsdLevel = 'high' | 'medium' | 'low' | 'noAsd';

export interface ParentalSettings {
    isInitialized: boolean; // To track if settings have been loaded
    blockViolence: boolean;
    blockInappropriate: boolean;
    dailyLimitHours: string; // Store as string for TextInput
    asdLevel: AsdLevel | null;
    downtimeEnabled: boolean; // Example placeholder state
    // Add more settings as needed...
}

interface ParentalControlsContextType extends ParentalSettings {
    updateSetting: <K extends keyof Omit<ParentalSettings, 'isInitialized'>>(key: K, value: ParentalSettings[K]) => void;
    saveAllSettings: () => Promise<void>; // Function to trigger explicit save if needed
}

// --- Defaults ---
const defaultSettings: ParentalSettings = {
    isInitialized: false,
    blockViolence: false,
    blockInappropriate: false,
    dailyLimitHours: '',
    asdLevel: null,
    downtimeEnabled: false,
};

const STORAGE_KEY = '@ParentalControlsSettings';

// --- Context ---
export const ParentalControlsContext = createContext<ParentalControlsContextType>({
    ...defaultSettings,
    updateSetting: () => { console.warn('ParentalControlsContext Provider not found'); },
    saveAllSettings: async () => { console.warn('ParentalControlsContext Provider not found'); },
});

// --- Provider Component ---
interface ParentalControlsProviderProps {
    children: ReactNode;
}

export const ParentalControlsProvider: React.FC<ParentalControlsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<ParentalSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true); // Loading state for initial load

    // Load settings from storage on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings);
                    // Merge stored settings with defaults to handle missing keys
                    setSettings(prev => ({ ...prev, ...parsedSettings, isInitialized: true }));
                } else {
                    setSettings(prev => ({ ...prev, isInitialized: true })); // Mark initialized even if no settings found
                }
            } catch (e) {
                console.error("Failed to load parental controls settings:", e);
                setSettings(prev => ({ ...prev, isInitialized: true })); // Mark initialized on error too
            } finally {
                 setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    // Save settings whenever they change (debounced or throttled might be better for performance)
    useEffect(() => {
        // Only save after initial load is complete
        if (settings.isInitialized) {
            const save = async () => {
                try {
                    // Don't save isInitialized flag itself
                    const { isInitialized, ...settingsToSave } = settings;
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
                     console.log("Parental Settings Saved to Storage");
                } catch (e) {
                    console.error("Failed to save parental controls settings:", e);
                }
            };
            save();
        }
    }, [settings]); // Save whenever any setting changes AFTER initialization

    // Update a single setting
    const updateSetting = useCallback(<K extends keyof Omit<ParentalSettings, 'isInitialized'>>(
        key: K,
        value: ParentalSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    // Explicit save function (optional, as useEffect saves automatically)
    const saveAllSettings = useCallback(async () => {
        try {
             const { isInitialized, ...settingsToSave } = settings;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
            console.log("Parental Settings Explicitly Saved");
        } catch (e) {
            console.error("Failed to explicitly save parental controls settings:", e);
        }
    }, [settings]);


    // Prevent rendering children until settings are loaded/initialized
    if (isLoading) {
         // Optionally return a loading indicator for the whole app section
         // return <ActivityIndicator size="large" />;
         return null; // Or just render nothing temporarily
    }


    return (
        <ParentalControlsContext.Provider value={{ ...settings, updateSetting, saveAllSettings }}>
            {children}
        </ParentalControlsContext.Provider>
    );
};

// --- Custom Hook ---
export const useParentalControls = (): ParentalControlsContextType => {
    return useContext(ParentalControlsContext);
};