// src/context/GridContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useCallback
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Define the possible layout types (matching GridLayoutScreen)
export type GridLayoutType = 'simple' | 'standard' | 'dense';

// Storage Key
const GRID_LAYOUT_STORAGE_KEY = '@Communify:gridLayout';

// Define the shape of the context data
interface GridContextProps {
    gridLayout: GridLayoutType;
    setGridLayout: (layout: GridLayoutType) => Promise<void>; // Make async for saving
    isLoadingLayout: boolean; // Indicate if loading from storage
}

// Create the context with default values
const GridContext = createContext<GridContextProps>({
    gridLayout: 'standard', // Default layout
    setGridLayout: async () => { console.warn('setGridLayout called before Provider')},
    isLoadingLayout: true,
});

// Custom hook for easy consumption
export const useGrid = () => useContext(GridContext);

// Define the props for the Provider component
interface GridProviderProps {
    children: ReactNode;
}

// Create the Provider Component
export const GridProvider: React.FC<GridProviderProps> = ({ children }) => {
    const [gridLayout, setGridLayoutState] = useState<GridLayoutType>('standard'); // Internal state
    const [isLoadingLayout, setIsLoadingLayout] = useState(true);

    // Load initial layout from storage
    useEffect(() => {
        let isMounted = true;
        const loadLayout = async () => {
            setIsLoadingLayout(true);
            try {
                const storedLayout = await AsyncStorage.getItem(GRID_LAYOUT_STORAGE_KEY);
                if (isMounted) {
                    if (storedLayout === 'simple' || storedLayout === 'standard' || storedLayout === 'dense') {
                        setGridLayoutState(storedLayout);
                        console.log('GridContext: Loaded layout from storage:', storedLayout);
                    } else {
                        console.log('GridContext: No valid layout in storage, using default.');
                        setGridLayoutState('standard'); // Fallback to default
                    }
                }
            } catch (e) {
                console.error('GridContext: Failed to load layout from storage.', e);
                 if (isMounted) setGridLayoutState('standard'); // Fallback on error
                Alert.alert("Load Error", "Could not load grid layout setting.");
            } finally {
                if (isMounted) setIsLoadingLayout(false);
            }
        };

        loadLayout();
        return () => { isMounted = false; }
    }, []);

    // Function to update layout and save to storage
    const setGridLayout = useCallback(async (newLayout: GridLayoutType) => {
        try {
            setGridLayoutState(newLayout); // Update state immediately for responsiveness
            await AsyncStorage.setItem(GRID_LAYOUT_STORAGE_KEY, newLayout);
            console.log('GridContext: Saved layout to storage:', newLayout);
        } catch (e) {
            console.error('GridContext: Failed to save layout to storage.', e);
            Alert.alert("Save Error", "Could not save grid layout setting.");
            // Optionally revert state if save fails? Depends on desired UX.
            // loadLayout(); // Re-load might be an option
        }
    }, []);

    // Value provided by the context
    const value = {
        gridLayout,
        setGridLayout,
        isLoadingLayout,
    };

    return (
        <GridContext.Provider value={value}>
            {children}
        </GridContext.Provider>
    );
};