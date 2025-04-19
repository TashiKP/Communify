import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Modal,
    Dimensions,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faDesktop, faShapes, faCommentDots, faUserShield, faInfoCircle, faChevronRight, faTimes
} from '@fortawesome/free-solid-svg-icons';

// --- Import Corrected Components and Types ---
// Import the SCREEN component and its data type
import DisplayOptionsScreen, { DisplaySettingsData } from './DisplayOptionsScreen';
// Import the MODAL component and its type (assuming it still exists or you need its type)
import SelectionMode, { SelectionModeScreenProps } from './SelectionModeScreen'; // Assuming SelectionMode is also a screen now
import ParentalControls, { ParentalSettingsData } from './ParentalControls'; // Assuming this is still a modal/component needing 'visible'
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen'; // Assuming this is still a modal/component needing 'visible'


// --- Types ---
type Mode = 'drag' | 'longClick';
// Keep the original DisplaySettings type ONLY if needed elsewhere, otherwise remove
// interface DisplaySettings {
//     layout: 0 | 50 | 100;
//     brightness: 0 | 50 | 100;
//     layoutLocked: boolean;
//     brightnessLocked: boolean;
// }

// --- Default Values ---
// Use the new defaults from DisplayOptionsScreen
const defaultDisplaySettingsData: DisplaySettingsData = {
    layout: 50, brightness: 50, layoutLocked: false, brightnessLocked: false,
    textSize: 'medium', darkModeEnabled: false,
};

const defaultSelectionMode: Mode | null = 'drag';

const defaultParentalSettings: ParentalSettingsData = {
    blockViolence: false, blockInappropriate: false, dailyLimitHours: '', asdLevel: null,
    downtimeEnabled: false, downtimeDays: [], downtimeStart: '21:00', downtimeEnd: '07:00',
    requirePasscode: false,
};

const defaultVoiceSettings: VoiceSettingData = {
    pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false,
    volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false,
};

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.50;

// --- Component Props Interface ---
interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
}

// --- Menu Items Configuration ---
const menuItems = [
    { id: 'display', icon: faDesktop, label: 'Display Options' },
    { id: 'selection', icon: faShapes, label: 'Symbol Selection' },
    { id: 'voiceover', icon: faCommentDots, label: 'Voice & Speech' },
    { id: 'parental', icon: faUserShield, label: 'Parental' },
    { id: 'about', icon: faInfoCircle, label: 'About Us' },
];

// --- Component ---
const Menu: React.FC<MenuProps> = ({ slideAnim, overlayAnim, closeMenu }) => {
    // State
    const [activeModal, setActiveModal] = useState<string | null>(null);
    // Use the new state type for Display Settings
    const [displaySettingsData, setDisplaySettingsData] = useState<DisplaySettingsData>(defaultDisplaySettingsData);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettingData>(defaultVoiceSettings);

    // Loading states (optional)
    const [isSavingDisplay, setIsSavingDisplay] = useState(false); // Add loading state
    const [isSavingSelection, setIsSavingSelection] = useState(false); // Add loading state
    const [isSavingParental, setIsSavingParental] = useState(false);
    const [isSavingVoice, setIsSavingVoice] = useState(false);

    // --- Handlers ---
    const handleMenuPress = (itemId: string) => { setActiveModal(itemId); };
    const handleCloseSubModal = () => { setActiveModal(null); };

    // Updated Save Handler for Display Settings
    const handleDisplaySave = async (settings: DisplaySettingsData) => {
        setIsSavingDisplay(true);
        console.log('Menu: Attempting to save Display Settings:', settings);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate save
            setDisplaySettingsData(settings); // Update state with the new data structure
            console.log('Menu: Display Settings Saved Successfully.');
            Alert.alert("Settings Saved", "Display options have been updated.");
            // DisplayOptionsScreen calls onClose internally
        } catch (error) {
            console.error("Menu: Failed to save display settings:", error);
            Alert.alert("Error", "Could not save display settings.");
            throw error; // Propagate error
        } finally {
            setIsSavingDisplay(false);
        }
    };

    // Updated Save Handler for Selection Mode (assuming it's a screen)
    const handleSelectionSave = async (mode: Mode | null) => {
        setIsSavingSelection(true);
        console.log('Menu: Attempting to save Selection Mode:', mode);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate save
            setSelectionModeValue(mode);
            console.log('Menu: Selection Mode Saved Successfully.');
            Alert.alert("Settings Saved", "Selection method has been updated.");
             // SelectionModeScreen calls onClose internally
        } catch (error) {
             console.error("Menu: Failed to save selection mode:", error);
             Alert.alert("Error", "Could not save selection method.");
             throw error; // Propagate error
        } finally {
            setIsSavingSelection(false);
        }
    };


    const handleParentalSave = async (settings: ParentalSettingsData) => {
        setIsSavingParental(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate save
            setParentalSettings(settings);
            console.log('Menu: Parental Settings Saved Successfully.');
            Alert.alert("Settings Saved", "Parental controls have been updated.");
        } catch (error) {
            console.error("Menu: Failed to save parental settings:", error);
            Alert.alert("Error", "Could not save parental settings.");
            throw error;
        } finally {
            setIsSavingParental(false);
        }
    };

    const handleVoiceSave = async (settings: VoiceSettingData) => {
        setIsSavingVoice(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
            setVoiceSettings(settings);
            console.log('Menu: Voice Settings Saved Successfully.');
            Alert.alert("Settings Saved", "Voice settings have been updated.");
        } catch (error) {
            console.error("Menu: Failed to save voice settings:", error);
            Alert.alert("Error", "Could not save voice settings.");
            throw error;
        } finally {
            setIsSavingVoice(false);
        }
    };

    // --- Memoize Settings for Prop Stability ---
    const memoizedDisplaySettingsData = useMemo(() => displaySettingsData, [displaySettingsData]); // Memoize new display state
    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);
    const memoizedVoiceSettings = useMemo(() => voiceSettings, [voiceSettings]);
    // No need to memoize selectionModeValue as it's primitive (null or string)

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

            {/* Overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                 <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} />
            </Animated.View>

            {/* Menu Container */}
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Menu Header */}
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Settings</Text>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={styles.hitSlop}>
                        <FontAwesomeIcon icon={faTimes} size={20} color="#6c757d" />
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <ScrollView
                    style={styles.menuScrollView}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => handleMenuPress(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconWrapper}>
                                <FontAwesomeIcon icon={item.icon} size={18} color="#0077b6" />
                            </View>
                            <Text style={styles.menuText} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={14} style={styles.menuArrow} color="#ced4da" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                 <View style={styles.menuFooter} />
            </Animated.View>

            {/* --- Sub-Modals / Screens --- */}

            {/* Display Options Screen */}
             <Modal
                visible={activeModal === 'display'}
                animationType="slide" // Present as screen
                transparent={false}
                onRequestClose={handleCloseSubModal}
             >
                {activeModal === 'display' &&
                    <DisplayOptionsScreen // Use the screen component
                        onClose={handleCloseSubModal}
                        initialSettings={memoizedDisplaySettingsData} // Pass correct prop name and data
                        onSave={handleDisplaySave} // Pass updated save handler
                    />
                }
            </Modal>

            {/* Selection Mode Screen (Assuming it's a screen now) */}
            <Modal
                visible={activeModal === 'selection'}
                animationType="slide" // Present as screen
                transparent={false}
                onRequestClose={handleCloseSubModal}
             >
                 {activeModal === 'selection' &&
                    <SelectionMode // Use the screen component
                        onClose={handleCloseSubModal}
                        initialMode={selectionModeValue} // Pass primitive directly
                        onSave={handleSelectionSave} // Pass updated save handler
                    />
                 }
            </Modal>

            {/* Voice Over Screen */}
             <Modal
                visible={activeModal === 'voiceover'}
                animationType="slide"
                transparent={false}
                onRequestClose={handleCloseSubModal}
             >
                {activeModal === 'voiceover' && (
                    <SymbolVoiceOverScreen
                        onClose={handleCloseSubModal}
                        initialSettings={memoizedVoiceSettings}
                        onSave={handleVoiceSave}
                    />
                )}
            </Modal>

            {/* Parental Controls (Assuming Modal Style) */}
             <Modal visible={activeModal === 'parental'} animationType="fade" transparent={true} onRequestClose={handleCloseSubModal} >
                 {activeModal === 'parental' && (
                    <ParentalControls
                        visible={true} // Pass visible prop back if it's still a modal component
                        onClose={handleCloseSubModal}
                        initialSettings={memoizedParentalSettings}
                        onSave={handleParentalSave}
                    />
                 )}
            </Modal>

            {/* About Us (Assuming Modal Style) */}
            <Modal visible={activeModal === 'about'} animationType="fade" transparent={true} onRequestClose={handleCloseSubModal} >
                {activeModal === 'about' &&
                    <AboutScreen onClose={handleCloseSubModal} />
                }
            </Modal>
        </View>
    );
};

// --- Styles --- (Keep your existing styles)
const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuContainer: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: menuWidth,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 7,
        elevation: 14,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    menuTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#343a40',
    },
    closeButtonInternal: {
        padding: 8,
    },
    menuScrollView: {
        flex: 1,
    },
    scrollContentContainer: {
         paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 15,
    },
    iconWrapper: {
        width: 30,
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: 15,
        color: '#212529',
        flex: 1,
        fontWeight: '500',
    },
    menuArrow: {
        marginLeft: 8,
        color: '#ced4da',
    },
    menuFooter: {
        height: Platform.OS === 'ios' ? 40 : 30,
        backgroundColor: '#ffffff',
    },
    hitSlop: {
        top: 10, bottom: 10, left: 10, right: 10
    }
});

export default Menu;