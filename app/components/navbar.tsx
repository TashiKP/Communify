// src/components/Navbar.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform, Animated,
    Easing, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import ProfileModal from './ProfileModal';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext'; // <-- Import Language Context

type RootStackParamList = { Login: undefined; };
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const AUTH_TOKEN_KEY = '@MyApp:AuthToken';

const Navbar = () => {
    const { theme, fonts } = useAppearance();
    const { currentLanguage, changeLanguage, isTranslating } = useLanguage(); // <-- Use Language Context
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const toggleAnim = useRef(new Animated.Value(currentLanguage === 'en' ? 0 : 1)).current;

    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    useEffect(() => {
        Animated.timing(toggleAnim, {
            toValue: currentLanguage === 'en' ? 0 : 1,
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
        }).start();
    }, [currentLanguage, toggleAnim]);

    const sliderPosition = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['3%', '47%'],
    });

    const toggleLanguageHandler = useCallback(() => {
        const newLang: LanguageCode = currentLanguage === 'en' ? 'dzo' : 'en';
        changeLanguage(newLang);
    }, [currentLanguage, changeLanguage]);

    const openProfileModal = useCallback(() => setProfileModalVisible(true), []);
    const closeProfileModal = useCallback(() => setProfileModalVisible(false), []);

    const handleLogout = async () => {
        closeProfileModal();
        try {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (e) {
            console.error("Logout failed", e);
            Alert.alert("Logout Error", "Could not log out. Please try again.");
        }
    };

    const userProfileData = useMemo(() => ({
        name: 'User Name', email: 'user@example.com', avatar: '',
    }), []);

    return (
        <>
            <View style={styles.navbar}>
                <View style={styles.navSectionLeft}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleLanguageHandler}
                        activeOpacity={0.8}
                        hitSlop={hitSlop}
                        accessibilityRole="switch"
                        accessibilityLabel="Toggle language"
                        accessibilityState={{ checked: currentLanguage === 'dzo' }}
                        disabled={isTranslating} // <-- Disable while translating
                    >
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Eng</Text>
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Dzo</Text>
                        <Animated.View style={[styles.toggleSlider, { left: sliderPosition }]}>
                            <Text style={styles.toggleTextActive}>
                                {currentLanguage === 'en' ? 'Eng' : 'རྫོང་ཁ'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                <View style={styles.navSectionCenter}>
                    <Text style={styles.navbarTitle}>Communify</Text>
                </View>

                <View style={styles.navSectionRight}>
                    <TouchableOpacity
                        onPress={openProfileModal}
                        hitSlop={hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel="Open user profile"
                    >
                        <FontAwesomeIcon
                            icon={faUserCircle}
                            size={fonts.h1 * 1.1}
                            color={theme.white}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ProfileModal
                visible={profileModalVisible}
                onClose={closeProfileModal}
                onLogout={handleLogout}
                userProfile={userProfileData}
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