// src/components/Navbar.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import {
    View, Text, StyleSheet, TouchableOpacity, Platform, Animated,
    Easing, Alert // Added Alert for potential logout errors
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import ProfileModal from './ProfileModal'; // Assuming './ProfileModal' is the correct path
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Keep for logout example

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Define Navigation Param List ---
// Replace with your actual stack parameters if using typed navigation
type RootStackParamList = {
  Login: undefined; // Route name for the Login screen
};

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const AUTH_TOKEN_KEY = '@MyApp:AuthToken'; // **IMPORTANT: Use your actual storage key**

// --- Component ---
const Navbar = () => {
    // --- Context ---
    const { theme, fonts } = useAppearance(); // Get theme and fonts

    // --- State ---
    const [isEnglish, setIsEnglish] = useState(true); // Language state
    const [profileModalVisible, setProfileModalVisible] = useState(false); // Profile modal visibility
    const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // Navigation hook
    const toggleAnim = useRef(new Animated.Value(0)).current; // Animation value for language toggle

    // --- Dynamic Styles ---
    // Memoize styles to avoid recalculation unless theme/fonts change
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Effects ---
    // Animate language toggle slider
    useEffect(() => {
        Animated.timing(toggleAnim, {
            toValue: isEnglish ? 0 : 1,
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false, // 'left' style animation requires JS driver
        }).start();
    }, [isEnglish, toggleAnim]);

    // Interpolate slider position based on animation value
    const sliderPosition = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['3%', '47%'], // Adjust percentages based on toggle design
    });

    // --- Handlers ---
    // Toggle language state and log (replace log with actual i18n logic)
    const toggleLanguage = useCallback(() => {
        setIsEnglish(previous => !previous);
        // TODO: Implement actual language switching logic (e.g., i18next.changeLanguage)
        console.log('Language toggled to:', !isEnglish ? 'English' : 'Dzongkha');
    }, [isEnglish]); // Include isEnglish if logic depends on previous value directly

    // Open and close the profile modal
    const openProfileModal = useCallback(() => setProfileModalVisible(true), []);
    const closeProfileModal = useCallback(() => setProfileModalVisible(false), []);

    const handleLogout = () => {
        closeProfileModal(); // Close modal first
        navigation.navigate('Login'); // Navigate after logout logic
    };

    // --- Dummy Profile Data (Replace with actual user data source) ---
    const userProfileData = useMemo(() => ({ // Memoize if data doesn't change often
        name: 'User Name', // Replace with actual name
        email: 'user@example.com', // Replace with actual email
        avatar: '', // Replace with actual avatar URI or leave empty/undefined
    }), []);

    return (
        <>
            {/* Navbar View - Uses themed styles */}
            <View style={styles.navbar}>
                {/* Left Section: Language Toggle */}
                <View style={styles.navSectionLeft}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleLanguage}
                        activeOpacity={0.8}
                        hitSlop={hitSlop} // Use defined hitSlop constant
                        accessibilityRole="switch"
                        accessibilityLabel="Toggle language between English and Dzongkha"
                        accessibilityState={{ checked: !isEnglish }}
                    >
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Eng</Text>
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Dzo</Text>
                        <Animated.View style={[ styles.toggleSlider, { left: sliderPosition } ]} >
                            <Text style={styles.toggleTextActive}>
                                {isEnglish ? 'Eng' : 'Dzo'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Center Section: App Title */}
                <View style={styles.navSectionCenter}>
                    <Text style={styles.navbarTitle}>Communify</Text>
                </View>

                {/* Right Section: Profile Icon */}
                <View style={styles.navSectionRight}>
                    <TouchableOpacity
                        onPress={openProfileModal}
                        hitSlop={hitSlop} // Use defined hitSlop constant
                        accessibilityRole="button"
                        accessibilityLabel="Open user profile"
                    >
                        <FontAwesomeIcon
                            icon={faUserCircle}
                            size={fonts.h1 * 1.1} // Icon size based on fonts
                            color={theme.white} // Icon color from theme (assuming white on primary bg)
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Modal Component */}
            <ProfileModal
                visible={profileModalVisible}
                onClose={closeProfileModal}
                onLogout={handleLogout} // Pass the logout handler
                userProfile={userProfileData} // Pass user data
                // ProfileModal uses useAppearance internally for styling
            />
        </>
    );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary, // Use theme primary color for background
        paddingTop: Platform.OS === 'ios' ? 10 : 5, // Adjust padding for status bar
        paddingBottom: 10,
        paddingHorizontal: 15,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.3 : 0.15, // Adjust shadow based on theme
        shadowRadius: 3,
        elevation: 4,
    },
    navSectionLeft: {
        width: 70, // Fixed width for left section
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    navSectionCenter: {
        flex: 1, // Take remaining space
        justifyContent: 'center',
        alignItems: 'center',
    },
    navSectionRight: {
        width: 70, // Fixed width for right section
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    toggleButton: {
        width: 65,
        height: 30,
        borderRadius: 15,
        // Use subtle background derived from theme
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    toggleSlider: {
        width: '50%',
        height: '88%',
        borderRadius: 12,
        marginVertical: '6%', // Center slider vertically
        backgroundColor: theme.white, // Slider knob is white
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        // Subtle shadow for slider knob
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    toggleText: {
         fontSize: fonts.caption, // Use theme font size
         fontWeight: 'bold',
         paddingHorizontal: 5,
    },
    toggleTextInactive: {
        // Adjust inactive color based on theme for contrast
         color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    },
    toggleTextActive: {
        color: theme.primary, // Active text color matches theme primary
        fontSize: fonts.caption, // Use theme font size
        fontWeight: 'bold',
    },
    navbarTitle: {
        fontSize: fonts.h1, // Use theme font size
        color: theme.white, // Keep title white for contrast on primary bg
        fontWeight: 'bold',
    },
    // hitSlop defined outside styles
});


export default Navbar;