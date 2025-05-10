// src/components/Navbar.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import ProfileModal from './ProfileModal';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next'; // <-- Import useTranslation

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext'; // Use updated context
// --- Import Typography Utility ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path

type RootStackParamList = { Login: undefined };
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const AUTH_TOKEN_KEY = '@MyApp:AuthToken'; // Use your actual key

const Navbar = () => {
  const { theme, fonts } = useAppearance();
  const { currentLanguage, changeLanguage } = useLanguage(); // Removed isTranslatingSymbols since it’s not used
  const { t, i18n } = useTranslation(); // <-- Get the t function
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  // Initialize animation based on current language state
  const toggleAnim = useRef(new Animated.Value(currentLanguage === 'en' ? 0 : 1)).current;

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language] // Added i18n.language to dependencies
  );

  // Animate toggle when language changes
  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: currentLanguage === 'en' ? 0 : 1,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false, // 'left' animation needs JS driver
    }).start();
  }, [currentLanguage, toggleAnim]);

  // Calculate slider position
  const sliderPosition = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '55%'], // Adjusted to account for Dzongkha text width
  });

  // Handler to toggle language via context (which uses i18next)
  const toggleLanguageHandler = useCallback(() => {
    const newLang: LanguageCode = currentLanguage === 'en' ? 'dzo' : 'en';
    console.log('Toggling language to:', newLang); // Debug log
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  // Profile modal handlers
  const openProfileModal = useCallback(() => setProfileModalVisible(true), []);
  const closeProfileModal = useCallback(() => setProfileModalVisible(false), []);

  // Logout handler
  const handleLogout = async () => {
    closeProfileModal();
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      console.error('Logout failed', e);
      // Use t function for alert message
      Alert.alert(t('profile.logoutErrorTitle'), t('profile.logoutErrorMessage'));
    }
  };

  // Dummy profile data (replace with actual data source)
  const userProfileData = useMemo(
    () => ({
      name: 'User Name', // TODO: Replace with actual data or translation key
      email: 'user@example.com', // TODO: Replace with actual data
      avatar: '',
    }),
    []
  );

  return (
    <>
      <View style={styles.navbar}>
        {/* Left Section: Language Toggle */}
        <View style={styles.navSectionLeft}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleLanguageHandler}
            activeOpacity={0.8}
            hitSlop={hitSlop}
            accessibilityRole="switch"
            accessibilityLabel={t('navbar.toggleLanguage')} // Use t()
            accessibilityState={{ checked: currentLanguage === 'dzo' }}
          >
            {/* Static text labels for the background */}
            <Text style={[styles.toggleText, styles.toggleTextInactive]}>{t('navbar.langEng')}</Text>
            <Text style={[styles.toggleText, styles.toggleTextInactive]}>{t('navbar.langDzo')}</Text>
            {/* Animated slider with the currently active language */}
            <Animated.View style={[styles.toggleSlider, { left: sliderPosition }]}>
              <Text style={styles.toggleTextActive}>
                {currentLanguage === 'en' ? t('navbar.langEng') : t('navbar.langDzo')}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Center Section: App Title */}
        <View style={styles.navSectionCenter}>
          <Text style={styles.navbarTitle}>{t('appName')}</Text> {/* Use t() */}
        </View>

        {/* Right Section: Profile Icon */}
        <View style={styles.navSectionRight}>
          <TouchableOpacity
            onPress={openProfileModal}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t('navbar.profileButton')} // Use t()
          >
            <FontAwesomeIcon icon={faUserCircle} size={fonts.h1 * 1.1} color={theme.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Modal Component */}
      <ProfileModal // Ensure ProfileModal uses useTranslation internally for its text
        visible={profileModalVisible}
        onClose={closeProfileModal}
        onLogout={handleLogout}
        userProfile={userProfileData}
      />
    </>
  );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingTop: Platform.OS === 'ios' ? 10 : 5,
      paddingBottom: 10,
      paddingHorizontal: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.15,
      shadowRadius: 3,
      elevation: 4,
    },
    navSectionLeft: {
      width: 70,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    navSectionCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navSectionRight: {
      width: 70,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    toggleButton: {
      width: 65,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      flexDirection: 'row',
      justifyContent: 'space-between', // Changed to space-between for better text separation
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    toggleSlider: {
      width: '50%', // Adjusted to fit text width
      height: '88%',
      borderRadius: 12,
      marginVertical: '6%',
      backgroundColor: theme.white,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
      elevation: 2,
    },
    toggleText: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage), // Apply typography for caption
      fontWeight: 'bold',
      paddingHorizontal: 2, // Reduced padding to fit text
    },
    toggleTextInactive: {
      color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    },
    toggleTextActive: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage), // Apply typography for caption
      color: theme.primary,
      fontWeight: 'bold',
    },
    navbarTitle: {
      ...getLanguageSpecificTextStyle('h1', fonts, currentLanguage), // Apply typography for h1
      color: theme.white,
      fontWeight: 'bold',
    },
  });

export default Navbar;