import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, ScrollView, TouchableOpacity, Animated, Modal, Text, StyleSheet, Platform, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faDesktop, faChild, faCommentDots, faUserShield, faInfoCircle, faChevronRight, faTimes
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as KeychainService from '../services/keychainService';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';
import DisplayOptionsScreen from './DisplayOptionsScreen';
import ChildInformationScreen from './ChildInformationScreen';
import ParentalControls from './ParentalControls';
import apiService, { ParentalSettingsData } from '../services/apiService';
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen';
import PasscodePromptModal from './PasscodePromptModal';

const PARENTAL_SETTINGS_STORAGE_KEY = '@Communify:parentalSettings';
const defaultParentalSettings: ParentalSettingsData = {
    blockViolence: false,
    blockInappropriate: false,
    dailyLimitHours: '',
    asdLevel: null,
    downtimeEnabled: false,
    downtimeDays: [],
    downtimeStart: '21:00',
    downtimeEnd: '07:00',
    requirePasscode: false,
    notifyEmails: [],
    dataSharingPreference: false,
};

// Define dummy child data
const defaultChildData = {
    user: {
        name: "Singye",
        age: 12,
        gender: "male",
        email: "singye@gmail.com",
    },
    childProfile: {
        asd_level: "medium",
        block_inappropriate: false,
        block_violence: false,
        data_sharing_preference: false,
        downtime_enabled: false,
        downtime_start: "21:00",
        downtime_end: "07:00",
        require_passcode: false,
    },
    appearanceSettings: {
        brightness: 50,
        dark_mode_enabled: false,
        font_size: "medium",
        symbol_grid_layout: "dense",
        tts_highlight_word: true,
        tts_pitch: 0.5,
        tts_speed: 0.5,
        tts_volume: 0.8,
    },
};

const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.3;
const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
    childData?: {
        user: {
            name: string;
            age: number;
            gender: string;
            email: string;
        };
        childProfile: {
            asd_level: string;
            block_inappropriate: boolean;
            block_violence: boolean;
            data_sharing_preference: boolean;
            downtime_enabled: boolean;
            downtime_start: string;
            downtime_end: string;
            require_passcode: boolean;
        };
        appearanceSettings: {
            brightness: number;
            dark_mode_enabled: boolean;
            font_size: string;
            symbol_grid_layout: string;
            tts_highlight_word: boolean;
            tts_pitch: number;
            tts_speed: number;
            tts_volume: number;
        };
    };
}

const Menu: React.FC<MenuProps> = ({
    slideAnim,
    overlayAnim,
    closeMenu,
    currentTtsSettings,
    onTtsSettingsSave,
    childData = defaultChildData, // Default to dummy data if not provided
}) => {
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    const [isLoadingParentalSettings, setIsLoadingParentalSettings] = useState(true);
    const [isCheckingPasscodeForMenu, setIsCheckingPasscodeForMenu] = useState(false);
    const [isUpdatingParentalCache, setIsUpdatingParentalCache] = useState(false);
    const [isPasscodePromptVisible, setIsPasscodePromptVisible] = useState(false);
    const [targetModalId, setTargetModalId] = useState<string | null>(null);
    const [localKeychainPasscodeExists, setLocalKeychainPasscodeExists] = useState(false);
    const isMountedRef = useRef(true);

    const menuItems = useMemo(() => [
        { id: 'display', icon: faDesktop, labelKey: 'menu.displayOptions' },
        { id: 'childInfo', icon: faChild, labelKey: 'menu.childInformation' },
        { id: 'voiceover', icon: faCommentDots, labelKey: 'menu.voiceAndSpeech' },
        { id: 'parental', icon: faUserShield, labelKey: 'menu.parentalControls' },
        { id: 'about', icon: faInfoCircle, labelKey: 'menu.aboutUs' },
    ], []);

    const isLoadingInitialSettings = isLoadingAppearance || isLoadingParentalSettings;

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const styles = useMemo(() => createThemedMenuStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    useEffect(() => {
        const loadAllMenuData = async () => {
            if (!isMountedRef.current || typeof t !== 'function') return;

            setIsLoadingParentalSettings(true);

            try {
                const [fetchedParentalSettings, keychainHasPasscode] = await Promise.all([
                    apiService.fetchParentalSettings(),
                    KeychainService.hasPasscode()
                ]);

                if (!isMountedRef.current) return;

                setParentalSettings({ ...defaultParentalSettings, ...fetchedParentalSettings });
                AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(fetchedParentalSettings)).catch(cacheError => {
                    console.warn("Menu: Failed to cache parental settings", cacheError);
                });

                setLocalKeychainPasscodeExists(keychainHasPasscode);
            } catch (error) {
                console.error("Menu: Failed to load initial menu data", error);
                if (isMountedRef.current && typeof t === 'function') {
                    Alert.alert(t('common.error'), t('menu.errors.loadSettingsFail'));
                    setParentalSettings(defaultParentalSettings);
                    setLocalKeychainPasscodeExists(false);
                }
            } finally {
                if (isMountedRef.current) setIsLoadingParentalSettings(false);
            }
        };

        if (typeof t === 'function' && i18n.isInitialized) {
            loadAllMenuData();
        }
    }, [t, i18n.isInitialized]);

    const handleCloseSubModal = useCallback(() => { setActiveModal(null); }, []);

    const handleMenuPress = useCallback(async (itemId: string) => {
        if (!isMountedRef.current || typeof t !== 'function' || isCheckingPasscodeForMenu) return;

        const protectedItems = ['parental', 'voiceover', 'display', 'childInfo'];

        if (itemId === 'about') {
            setActiveModal(itemId);
            return;
        }

        if (isLoadingInitialSettings) {
            Alert.alert(t('menu.loadingTitle', 'Loading...'), t('menu.loadingMessage', 'Settings are loading, please wait.'));
            return;
        }

        if (protectedItems.includes(itemId)) {
            if (parentalSettings.requirePasscode) {
                setIsCheckingPasscodeForMenu(true);
                setTargetModalId(itemId);
                try {
                    const backendPasscodeStatus = await apiService.checkBackendHasParentalPasscode();
                    if (!isMountedRef.current) return;

                    if (backendPasscodeStatus.exists) {
                        setIsPasscodePromptVisible(true);
                    } else {
                        Alert.alert(
                            t('menu.errors.passcodeIssueTitle', 'Passcode Setup Issue'),
                            t('menu.errors.passcodeRequiredButNotConfiguredMenu', 'A passcode is required by your settings, but it appears none is configured on the server. Please visit Parental Controls to set up a passcode.'),
                            [{ text: t('common.ok') }]
                        );
                        setTargetModalId(null);
                    }
                } catch (error) {
                    if (!isMountedRef.current) return;
                    console.error("Menu: Error checking backend passcode status for menu access:", error);
                    Alert.alert(t('common.error'), t('menu.errors.passcodeStatusCheckFailedMenu', 'Could not verify passcode status. Please try again.'));
                    setTargetModalId(null);
                } finally {
                    if (isMountedRef.current) setIsCheckingPasscodeForMenu(false);
                }
            } else {
                setActiveModal(itemId);
            }
        } else {
            setActiveModal(itemId);
        }
    }, [parentalSettings, isLoadingInitialSettings, isCheckingPasscodeForMenu, t, i18n.language, targetModalId]);

    const handlePasscodeVerified = useCallback(() => {
        if (isMountedRef.current) {
            setIsPasscodePromptVisible(false);
            if (targetModalId) {
                setActiveModal(targetModalId);
            }
            setTargetModalId(null);
        }
    }, [targetModalId]);

    const handlePasscodeCancel = useCallback(() => {
        if (isMountedRef.current) {
            setIsPasscodePromptVisible(false);
            setTargetModalId(null);
        }
    }, []);

    const handleParentalSettingsUpdate = useCallback(async (updatedSettingsFromApi: ParentalSettingsData) => {
        if (typeof t !== 'function' || !isMountedRef.current) return;

        setIsUpdatingParentalCache(true);
        try {
            setParentalSettings(updatedSettingsFromApi);
            await AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettingsFromApi));
            const hasPC = await KeychainService.hasPasscode();
            if (isMountedRef.current) setLocalKeychainPasscodeExists(hasPC);
        } catch (error) {
            console.error("Menu: Failed to update local parental settings cache after API save:", error);
            if (isMountedRef.current && typeof t === 'function') {
                Alert.alert(t('common.error'), t('menu.errors.saveParentalFail'));
            }
        } finally {
            if (isMountedRef.current) setIsUpdatingParentalCache(false);
        }
    }, [t]);

    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);

    if (!i18n.isInitialized || typeof t !== 'function' || isLoadingAppearance) {
        return (
            <View style={[styles.menuContainerIfLoading, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary || '#007bff'} />
            </View>
        );
    }

    const renderMenuContent = () => (
        <ScrollView style={styles.menuScrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => {
                const label = t(item.labelKey);
                const isDisabledByLoading = isLoadingInitialSettings || (isCheckingPasscodeForMenu && targetModalId === item.id);
                const isProtectedItem = ['parental', 'voiceover', 'display', 'childInfo'].includes(item.id);

                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, isDisabledByLoading && isProtectedItem && item.id !== 'about' && styles.menuItemDisabled]}
                        onPress={() => handleMenuPress(item.id)}
                        activeOpacity={0.6}
                        disabled={isDisabledByLoading && isProtectedItem && item.id !== 'about'}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ disabled: isDisabledByLoading && isProtectedItem && item.id !== 'about' }}
                    >
                        <View style={[styles.iconWrapper, isDisabledByLoading && isProtectedItem && item.id !== 'about' && styles.disabledIconWrapper]}>
                            {(isCheckingPasscodeForMenu && targetModalId === item.id && isProtectedItem) ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <FontAwesomeIcon icon={item.icon} size={fonts.body * 1.3} color={theme.primary} />
                            )}
                        </View>
                        <Text style={[styles.menuText, isDisabledByLoading && isProtectedItem && item.id !== 'about' && styles.disabledMenuText]}>{label}</Text>
                        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} style={[styles.menuArrow, isDisabledByLoading && isProtectedItem && item.id !== 'about' && styles.disabledMenuArrow]} color={theme.border} />
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} accessibilityLabel={t('menu.closeMenuAccessibilityLabel')} />
            </Animated.View>
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>{t('menu.title')}</Text>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={hitSlop} accessibilityLabel={t('menu.closeMenuAccessibilityLabel')}>
                        <FontAwesomeIcon icon={faTimes} size={fonts.h2} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
                {isLoadingInitialSettings ? <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} /> : renderMenuContent()}
                <View style={styles.menuFooter} />
            </Animated.View>

            <Modal visible={activeModal === 'display'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal}>
                {activeModal === 'display' && <DisplayOptionsScreen onClose={handleCloseSubModal} />}
            </Modal>
            <Modal visible={activeModal === 'childInfo'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal}>
                {activeModal === 'childInfo' && <ChildInformationScreen childData={childData} onClose={handleCloseSubModal} />}
            </Modal>
            <Modal visible={activeModal === 'voiceover'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal}>
                {activeModal === 'voiceover' && <SymbolVoiceOverScreen onClose={handleCloseSubModal} initialSettings={currentTtsSettings} onSave={onTtsSettingsSave} />}
            </Modal>
            <Modal visible={activeModal === 'parental'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal}>
                {activeModal === 'parental' && <ParentalControls onClose={handleCloseSubModal} initialSettings={memoizedParentalSettings} onSaveSuccess={handleParentalSettingsUpdate} />}
            </Modal>
            <Modal visible={activeModal === 'about'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal}>
                {activeModal === 'about' && <AboutScreen onClose={handleCloseSubModal} />}
            </Modal>

            <PasscodePromptModal visible={isPasscodePromptVisible} onClose={handlePasscodeCancel} onVerified={handlePasscodeVerified} />
        </View>
    );
};

const createThemedMenuStyles = (theme: ThemeColors, baseFonts: FontSizes, language: string) => StyleSheet.create({
    menuContainerIfLoading: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: menuWidth,
        backgroundColor: theme.card || '#ffffff',
        borderRightWidth: 1,
        borderRightColor: theme.border || '#e0e6ed',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    menuContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: menuWidth,
        backgroundColor: theme.card || '#ffffff',
        borderRightWidth: 1,
        borderRightColor: theme.border || '#e0e6ed',
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 12,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 64 : 48,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: theme.card || '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#e0e6ed',
    },
    menuTitle: {
        fontWeight: '700',
        color: theme.text || '#1a1d21',
        ...getLanguageSpecificTextStyle('h1', baseFonts, language),
        letterSpacing: 0.5,
    },
    closeButtonInternal: {
        padding: 12,
        borderRadius: 20,
        backgroundColor: theme.background || '#f5faff',
    },
    menuScrollView: {
        flex: 1,
        backgroundColor: theme.card || '#ffffff',
    },
    scrollContentContainer: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 4,
        marginHorizontal: 8,
        backgroundColor: theme.card || '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItemDisabled: {
        backgroundColor: theme.disabled || '#e0e6ed',
        opacity: 0.7,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: theme.background || '#f5faff',
    },
    disabledIconWrapper: {
        opacity: 0.5,
    },
    menuText: {
        color: theme.text || '#1a1d21',
        flex: 1,
        fontWeight: '600',
        ...getLanguageSpecificTextStyle('body', baseFonts, language),
        letterSpacing: 0.3,
    },
    disabledMenuText: {
        color: theme.disabled || '#a0aec0',
    },
    menuArrow: {
        marginLeft: 12,
        color: theme.border || '#cbd5e0',
    },
    disabledMenuArrow: {
        opacity: 0.5,
    },
    menuFooter: {
        height: Platform.OS === 'ios' ? 48 : 40,
        backgroundColor: theme.card || '#ffffff',
        borderTopWidth: 1,
        borderTopColor: theme.border || '#e0e6ed',
    },
});

export default Menu;