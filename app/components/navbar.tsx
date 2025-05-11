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
import { useTranslation } from 'react-i18next';

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const Navbar: React.FC = () => {
  const { theme, fonts } = useAppearance();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const toggleAnim = useRef(new Animated.Value(currentLanguage === 'en' ? 0 : 1)).current;

  const [profileName, setProfileName] = useState(() => t('profile.defaultUserName', 'Communify User'));
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const profileEmail = 'user@example.com';

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage]
  );

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: currentLanguage === 'en' ? 0 : 1,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    return () => {
      toggleAnim.stopAnimation();
    };
  }, [currentLanguage, toggleAnim]);

  const sliderPosition = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '55%'],
  });

  const toggleLanguageHandler = useCallback(() => {
    const newLang: LanguageCode = currentLanguage === 'en' ? 'dzo' : 'en';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  const openProfileModal = useCallback(() => setProfileModalVisible(true), []);
  const closeProfileModal = useCallback(() => setProfileModalVisible(false), []);

  const handleLogout = async () => {
    console.log('[Navbar] Logout initiated. Closing modal.');
    closeProfileModal(); // Modal closes

    // --- DELAY REMOVED ---
    // console.log('[Navbar] Modal closed, delaying signOut.');
    // await new Promise(resolve => setTimeout(resolve, 300));
    // --- END DELAY REMOVED ---

    console.log('[Navbar] Calling auth.signOut() immediately after modal close.');
    try {
      await signOut();
      console.log('[Navbar] auth.signOut() completed successfully.');
    } catch (e) {
      console.error('[Navbar] Error during signOut:', e);
      Alert.alert(
        t('profile.logoutErrorTitle', 'Logout Error'),
        t('profile.logoutErrorMessage', 'Could not log out. Please try again.')
      );
    }
  };

  const handleSaveProfile = useCallback(async (newName: string, newAvatarUri?: string | null) => {
    console.log('[Navbar] Attempting to save profile. Name:', newName, 'Avatar:', newAvatarUri);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProfileName(newName);
        setProfileAvatar(newAvatarUri ?? undefined);
        console.log('[Navbar] Profile updated locally.');
        resolve();
      }, 500);
    });
  }, []);

  const userProfileData = useMemo(
    () => ({
      name: profileName,
      email: profileEmail,
      avatar: profileAvatar,
    }),
    [profileName, profileEmail, profileAvatar]
  );

  return (
    <>
      <View style={styles.navbar}>
        {/* ... rest of Navbar JSX ... */}
        <View style={styles.navSectionLeft}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleLanguageHandler}
            activeOpacity={0.8}
            hitSlop={hitSlop}
            accessibilityRole="switch"
            accessibilityLabel={t('navbar.toggleLanguage', 'Toggle language')}
            accessibilityState={{ checked: currentLanguage === 'dzo' }}
          >
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleText, styles.toggleTextInactive]}>
                {t('navbar.langEng', 'EN')}
              </Text>
              <Text style={[styles.toggleText, styles.toggleTextInactive]}>
                {t('navbar.langDzo', 'DZ')}
              </Text>
            </View>
            <Animated.View style={[styles.toggleSlider, { left: sliderPosition }]}>
              <Text style={styles.toggleTextActive}>
                {currentLanguage === 'en' ? t('navbar.langEng', 'EN') : t('navbar.langDzo', 'DZ')}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.navSectionCenter}>
          <Text style={styles.navbarTitle}>{t('appName', 'Communify')}</Text>
        </View>

        <View style={styles.navSectionRight}>
          <TouchableOpacity
            onPress={openProfileModal}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t('navbar.profileButton', 'Open profile')}
          >
            <FontAwesomeIcon icon={faUserCircle} size={fonts.h1 * 1.1} color={theme.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ProfileModal
        visible={profileModalVisible}
        onClose={closeProfileModal}
        onLogout={handleLogout}
        userProfile={userProfileData}
        onSave={handleSaveProfile}
      />
    </>
  );
};

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
      position: 'relative',
      overflow: 'hidden',
    },
    toggleTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      paddingHorizontal: 4,
    },
    toggleSlider: {
      width: '50%',
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
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      fontWeight: 'bold',
      fontSize: fonts.caption * 0.9,
    },
    toggleTextInactive: {
      color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    },
    toggleTextActive: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      color: theme.primary,
      fontWeight: 'bold',
      fontSize: fonts.caption * 0.9,
    },
    navbarTitle: {
      ...getLanguageSpecificTextStyle('h1', fonts, currentLanguage),
      color: theme.white,
      fontWeight: 'bold',
    },
  });

export default Navbar;