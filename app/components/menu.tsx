// src/components/menu.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, ScrollView, TouchableOpacity, Animated, Modal, Text, StyleSheet, Platform, Dimensions, Alert // Added imports
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faDesktop, faShapes, faCommentDots, faUserShield, faInfoCircle, faChevronRight, faTimes
} from '@fortawesome/free-solid-svg-icons';

// --- Import Corrected Components and Types --- (Adjust paths as necessary)
import DisplayOptionsScreen, { DisplaySettingsData } from './DisplayOptionsScreen';
import SelectionModeScreen from './SelectionModeScreen'; // Use correct export name
import ParentalControls, { ParentalSettingsData } from './ParentalControls';
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen';

// --- Types ---
type Mode = 'drag' | 'longClick';

// --- Default Values --- (Keep as before)
const defaultDisplaySettingsData: DisplaySettingsData = { layout: 50, brightness: 50, layoutLocked: false, brightnessLocked: false, textSize: 'medium', darkModeEnabled: false };
const defaultSelectionMode: Mode | null = 'drag';
const defaultParentalSettings: ParentalSettingsData = { blockViolence: false, blockInappropriate: false, dailyLimitHours: '', asdLevel: null, downtimeEnabled: false, downtimeDays: [], downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false };
// Removed defaultVoiceSettings - initial value comes from props

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.50; // Adjust width as needed (e.g., 0.7 for wider menu)

// --- Component Props Interface ---
interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
    // --- Add TTS Props ---
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void; // Changed from Promise<void>|void to void for simplicity
    // ---------------------
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
const Menu: React.FC<MenuProps> = ({
    slideAnim,
    overlayAnim,
    closeMenu,
    // --- Destructure TTS Props ---
    currentTtsSettings,
    onTtsSettingsSave,
    // ---------------------------
}) => {
    // State
    const [activeModal, setActiveModal] = useState<string | null>(null);
    // State for settings managed internally by Menu (Load these properly)
    const [displaySettingsData, setDisplaySettingsData] = useState<DisplaySettingsData>(defaultDisplaySettingsData);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);

    // Loading states (optional, for internal saving simulation)
    const [isSavingDisplay, setIsSavingDisplay] = useState(false);
    const [isSavingSelection, setIsSavingSelection] = useState(false);
    const [isSavingParental, setIsSavingParental] = useState(false);

    // --- Handlers ---
    const handleMenuPress = (itemId: string) => { setActiveModal(itemId); };
    const handleCloseSubModal = () => { setActiveModal(null); };

    // Save Handlers for settings managed by Menu
    const handleDisplaySave = async (settings: DisplaySettingsData) => {
        setIsSavingDisplay(true);
        console.log('Menu: Saving Display Settings:', settings);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
            setDisplaySettingsData(settings);
            // TODO: Persist displaySettingsData
            // Alert.alert("Settings Saved", "Display options updated."); // Feedback handled by HomeScreen now
        } catch (error) { console.error("Menu: Failed to save display settings:", error); Alert.alert("Error", "Could not save display settings."); throw error; }
        finally { setIsSavingDisplay(false); handleCloseSubModal(); } // Close modal after save/error
    };

    const handleSelectionSave = async (mode: Mode | null) => {
        setIsSavingSelection(true);
        console.log('Menu: Saving Selection Mode:', mode);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setSelectionModeValue(mode);
            // TODO: Persist selectionModeValue
        } catch (error) { console.error("Menu: Failed to save selection mode:", error); Alert.alert("Error", "Could not save selection method."); throw error; }
        finally { setIsSavingSelection(false); handleCloseSubModal();}
    };

    const handleParentalSave = async (settings: ParentalSettingsData) => {
        setIsSavingParental(true);
        console.log('Menu: Saving Parental Settings:', settings);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setParentalSettings(settings);
            // TODO: Persist parentalSettings
        } catch (error) { console.error("Menu: Failed to save parental settings:", error); Alert.alert("Error", "Could not save parental settings."); throw error; }
        finally { setIsSavingParental(false); handleCloseSubModal();}
    };

    // --- Memoize Settings for Prop Stability ---
    const memoizedDisplaySettingsData = useMemo(() => displaySettingsData, [displaySettingsData]);
    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);
    // No need to memoize selectionModeValue (primitive) or currentTtsSettings (prop)

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} accessibilityLabel="Close menu" />
            </Animated.View>

            {/* Menu Container */}
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Menu Header */}
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Settings</Text>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={styles.hitSlop} accessibilityLabel="Close settings menu">
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
                            accessibilityRole="button"
                            accessibilityLabel={item.label}
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

            {/* Display Options Modal */}
             <Modal visible={activeModal === 'display'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'display' &&
                    <DisplayOptionsScreen
                        onClose={handleCloseSubModal}
                        initialSettings={memoizedDisplaySettingsData} // Use memoized internal state
                        onSave={handleDisplaySave} // Use internal save handler
                    />
                }
            </Modal>

            {/* Selection Mode Modal */}
            <Modal visible={activeModal === 'selection'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                 {activeModal === 'selection' &&
                    <SelectionModeScreen
                        onClose={handleCloseSubModal}
                        initialMode={selectionModeValue} // Use internal state
                        onSave={handleSelectionSave} // Use internal save handler
                    />
                 }
            </Modal>

            {/* --- Voice Over Screen Modal (MODIFIED) --- */}
             <Modal visible={activeModal === 'voiceover'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'voiceover' && (
                    <SymbolVoiceOverScreen
                        onClose={handleCloseSubModal}
                        initialSettings={currentTtsSettings} // <-- Pass PROP from HomeScreen
                        onSave={onTtsSettingsSave}           // <-- Pass PROP from HomeScreen
                    />
                )}
            </Modal>

            {/* Parental Controls Modal */}
             <Modal visible={activeModal === 'parental'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                 {activeModal === 'parental' && (
                    <ParentalControls
                        // Pass visible prop if it's still a modal component? Or handle internally?
                        // Assuming ParentalControls is now a full screen modal component:
                        // visible={true} // Not needed if using Modal wrapper like others
                        onClose={handleCloseSubModal}
                        initialSettings={memoizedParentalSettings} // Use internal state
                        onSave={handleParentalSave} // Use internal save handler
                        visible={false}                    />
                 )}
            </Modal>

            {/* About Us Screen Modal */}
            {/* Assuming AboutScreen handles its own presentation style if needed */}
            <Modal visible={activeModal === 'about'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'about' &&
                    <AboutScreen onClose={handleCloseSubModal} />
                }
            </Modal>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Standard overlay color
    },
    menuContainer: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: menuWidth,
        backgroundColor: '#ffffff', // White background for the menu
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 }, // Shadow to the right
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 16, // Elevation for Android shadow
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40, // More space at top for status bar/notch
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef', // Light border
    },
    menuTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#343a40', // Darker title
    },
    closeButtonInternal: {
        padding: 8, // Make tap area larger
    },
    menuScrollView: {
        flex: 1, // Allow scrolling
    },
    scrollContentContainer: {
         paddingVertical: 8, // Padding top/bottom for scroll items
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16, // Vertical padding for items
        paddingHorizontal: 15, // Horizontal padding for items
    },
    iconWrapper: {
        width: 30, // Fixed width for icon alignment
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: 15, // Readable text size
        color: '#212529', // Dark text color
        flex: 1, // Allow text to take available space
        fontWeight: '500', // Medium weight
    },
    menuArrow: {
        marginLeft: 8,
        color: '#ced4da', // Light grey for chevron
    },
    menuFooter: {
        height: Platform.OS === 'ios' ? 40 : 30, // Space at the bottom
        backgroundColor: '#ffffff', // Match menu background
    },
    hitSlop: { // Reusable hitSlop
        top: 10, bottom: 10, left: 10, right: 10
    }
});

export default Menu;