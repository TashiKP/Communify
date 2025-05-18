// src/components/Navbar.tsx
import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faUserCircle} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import RNFS from 'react-native-fs'; // Keep for profile save logic

// --- React Navigation Imports ---
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainAppStackParamList} from '../navigation/MainAppNavigator'; // Adjust path if necessary

// --- App Imports ---
import ProfileModal from './ProfileModal'; // Adjust path if necessary
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext'; // Adjust path if necessary
import {useLanguage, LanguageCode} from '../context/LanguageContext'; // Adjust path if necessary
import {useAuth} from '../context/AuthContext'; // Adjust path if necessary
import {getLanguageSpecificTextStyle} from '../styles/typography'; // Adjust path if necessary
import apiService, {handleApiError, UserRead} from '../services/apiService'; // Adjust path if necessary
// import { ASYNC_STORAGE_KEYS } from '../constants/storageKeys'; // Uncomment if ASYNC_STORAGE_KEYS is used

const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};


type NavbarNavigationProp = NativeStackNavigationProp<MainAppStackParamList>;

const Navbar: React.FC = () => {
  const {theme, fonts} = useAppearance();
  const {currentLanguage, changeLanguage} = useLanguage();
  const {
    user: authUser,
    setUser: setAuthContextUser,
    updateUserAvatarInContextAndStorage,
  } = useAuth();
  const {t} = useTranslation();
  const navigation = useNavigation<NavbarNavigationProp>();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const toggleAnim = useRef(
    new Animated.Value(currentLanguage === 'en' ? 0 : 1),
  ).current;
  const isMountedRef = useRef(true); // To prevent state updates on unmounted component
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage],
  );

  // Effect for managing the mounted state of the component
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Effect for language toggle animation
  useEffect(() => {
    const animation = Animated.timing(toggleAnim, {
      toValue: currentLanguage === 'en' ? 0 : 1,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false, // Necessary for 'left' style animation
    });

    animation.start();

    return () => {
      // Stop the animation when the component unmounts or currentLanguage/toggleAnim changes
      animation.stop();
    };
  }, [currentLanguage, toggleAnim]);

  const sliderPosition = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '55%'], // Adjust these values based on your layout
  });

  const toggleLanguageHandler = useCallback(() => {
    const newLang: LanguageCode = currentLanguage === 'en' ? 'dzo' : 'en';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  const openProfileModal = useCallback(() => {
    if (isMountedRef.current) setProfileModalVisible(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    if (isMountedRef.current) setProfileModalVisible(false);
  }, []);

  const handleLogoutNavigation = useCallback(() => {
    if (profileModalVisible) {
      closeProfileModal(); // Ensure modal is closed before navigating
    }
    console.log('[Navbar] Logout initiated. Navigating to LoggingOut screen.');
    navigation.navigate('LoggingOut');
  }, [profileModalVisible, closeProfileModal, navigation]);

  const handleSaveProfile = useCallback(
    async (
      newName: string,
      avatarUpdateInstruction?: string | null, // Can be a new path, null to remove, or undefined if no change
    ) => {
      if (
        !authUser ||
        !setAuthContextUser ||
        !updateUserAvatarInContextAndStorage
      ) {
        Alert.alert(
          t('common.error', 'Authentication Error'),
          'User not authenticated. Cannot save profile.',
        );
        return;
      }

      if (isMountedRef.current) setIsSavingProfile(true);

      try {
        let updatedUserFromApi: UserRead | null = null;
        const trimmedNewName = newName.trim();

        // Update name if changed
        if (trimmedNewName !== authUser.name) {
          updatedUserFromApi = await apiService.updateCurrentUserProfile({
            name: trimmedNewName,
          });
        }

        let finalLocalAvatarPathForContext = authUser.localAvatarPath;

        // Handle avatar update if instruction is provided (not undefined)
        if (avatarUpdateInstruction !== undefined) {
          // An avatar update IS requested
          const oldLocalAvatarPathFromContext = authUser.localAvatarPath;
          await updateUserAvatarInContextAndStorage(
            authUser.id,
            avatarUpdateInstruction,
          );
          finalLocalAvatarPathForContext = avatarUpdateInstruction;
          if (
            oldLocalAvatarPathFromContext &&
            oldLocalAvatarPathFromContext !== finalLocalAvatarPathForContext
          ) {
            const pathToDelete = oldLocalAvatarPathFromContext.replace(
              'file://',
              '',
            );
            try {
              if (await RNFS.exists(pathToDelete)) {
                await RNFS.unlink(pathToDelete);
                console.log(
                  '[Navbar] Successfully deleted old avatar file:',
                  pathToDelete,
                );
              }
            } catch (deleteError) {
              console.error(
                '[Navbar] Error deleting old avatar file:',
                deleteError,
              );
            }
          }
        }

        // Update AuthContext
        setAuthContextUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            name: updatedUserFromApi?.name || trimmedNewName, // Use API name if available, else trimmed input
            ...(updatedUserFromApi
              ? {age: updatedUserFromApi.age, gender: updatedUserFromApi.gender}
              : {}), // Spread other details if API call was made
            localAvatarPath: finalLocalAvatarPathForContext,
          };
        });

        if (isMountedRef.current) {
          Alert.alert(
            t('profile.saveSuccessTitle', 'Profile Updated'),
            t('profile.saveSuccessMessage', 'Your profile has been updated.'),
          );
          closeProfileModal();
        }
      } catch (error) {
        const apiError = handleApiError(error);
        if (isMountedRef.current) {
          Alert.alert(
            t('profile.errors.saveFailTitle', 'Update Failed'),
            apiError.message,
          );
        }
      } finally {
        if (isMountedRef.current) setIsSavingProfile(false);
      }
    },
    [
      authUser,
      setAuthContextUser,
      updateUserAvatarInContextAndStorage,
      t,
      closeProfileModal,
    ],
  );

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
            accessibilityLabel={t('navbar.toggleLanguage')}
            accessibilityState={{checked: currentLanguage === 'dzo'}}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleText, styles.toggleTextInactive]}>
                EN
              </Text>
              <Text style={[styles.toggleText, styles.toggleTextInactive]}>
                DZ
              </Text>
            </View>
            <Animated.View
              style={[styles.toggleSlider, {left: sliderPosition}]}>
              <Text style={styles.toggleTextActive}>
                {currentLanguage === 'en' ? 'EN' : 'DZ'}
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
            accessibilityLabel={t('navbar.profileButton')}
            disabled={!authUser || isSavingProfile} // Disable if no user or currently saving
          >
            {isSavingProfile && authUser ? (
              <ActivityIndicator size={fonts.h1 * 0.8} color={theme.white} />
            ) : authUser?.localAvatarPath ? (
              <Image
                source={{uri: authUser.localAvatarPath}}
                style={styles.navbarAvatar}
              />
            ) : (
              <FontAwesomeIcon
                icon={faUserCircle}
                size={fonts.h1 * 1.0}
                color={theme.white}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {profileModalVisible && authUser && (
        <ProfileModal
          visible={profileModalVisible}
          onClose={closeProfileModal}
          onLogout={handleLogoutNavigation}
          onSave={handleSaveProfile}
          // Ensure ProfileModal receives necessary props like authUser for initial values
          // currentUser={authUser} // Example: if ProfileModal needs the user object
        />
      )}
    </>
  );
};

const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) =>
  StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingTop: Platform.OS === 'ios' ? 40 : 10,
      paddingBottom: 10,
      paddingHorizontal: 15,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: theme.isDark ? 0.4 : 0.1,
      shadowRadius: 3,
      elevation: 5,
      zIndex: 10, // Ensure Navbar is above other content
    },
    navSectionLeft: {
      width: 70, // Fixed width for alignment
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    navSectionCenter: {
      flex: 1, // Takes remaining space
      justifyContent: 'center',
      alignItems: 'center',
    },
    navSectionRight: {
      width: 70, // Fixed width for alignment
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    toggleButton: {
      width: 65,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      position: 'relative', // For absolute positioning of the slider
    },
    toggleTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      paddingHorizontal: 5,
    },
    toggleSlider: {
      width: '48%', // Or a fixed pixel value
      height: '80%',
      borderRadius: 12,
      backgroundColor: theme.white,
      position: 'absolute',
      top: '10%',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 1, // Android shadow
      shadowColor: '#000', // iOS shadow
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    toggleText: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      fontWeight: 'bold',
      fontSize: fonts.caption * 0.85, // Adjust multiplier as needed
    },
    toggleTextInactive: {
      color: theme.isDark ? 'rgba(255,255,255,0.7)' : theme.white,
    },
    toggleTextActive: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      color: theme.primary,
      fontWeight: 'bold',
      fontSize: fonts.caption * 0.85, // Adjust multiplier as needed
    },
    navbarTitle: {
      ...getLanguageSpecificTextStyle('h1', fonts, currentLanguage),
      color: theme.white,
      fontWeight: 'bold',
    },
    navbarAvatar: {
      width: fonts.h1 * 1.0, // Dynamic size based on font settings
      height: fonts.h1 * 1.0,
      borderRadius: (fonts.h1 * 1.0) / 2, // Make it a circle
      backgroundColor: theme.disabled, // Placeholder background if image fails
    },
  });

export default Navbar;
