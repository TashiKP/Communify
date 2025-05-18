// src/components/bottomnav.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Text
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faHome, faKeyboard, faCog
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// Corrected import path for VoiceSettingData
import { VoiceSettingData } from './SymbolVoiceOver/types'; // <--- MODIFIED LINE

// --- Constants ---
const BAR_HEIGHT = 65;

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void;
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void;
    onTextInputSubmit: (text: string) => void;
    currentLanguage?: string;
    onCustomSymbolsUpdate?: (symbols: any[]) => void;
    currentTtsSettings: VoiceSettingData; // This type will now be correctly resolved
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
    openMenu: () => void;
    openSearchScreen: () => void;
    openCustomPageModal: () => void;
    openKeyboardInput: () => void;
};

// --- Component ---
const BottomBar: React.FC<BottomBarProps> = React.memo(({
    handleHomePress,
    currentLanguage = 'en', // currentLanguage prop is defined but not used in the provided snippet.
    // onSymbolSelected, onTextInputSubmit, onCustomSymbolsUpdate, currentTtsSettings, onTtsSettingsSave are also defined but not directly used in the destructuring or body.
    // This might be intentional if they are passed down or handled elsewhere not shown.
    openMenu,
    openSearchScreen,
    openCustomPageModal,
    openKeyboardInput,
}) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    if (!i18n.isInitialized || typeof t !== 'function') {
        return (
            <LinearGradient
                colors={[theme.primary || '#0077b6', theme.isDark ? (theme.primaryMuted || '#005082') : (theme.primary || '#0077b6')]}
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent} />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={[theme.primary, theme.isDark ? theme.primaryMuted : theme.primary]}
            style={styles.bottomBarGradient}
        >
            <View style={styles.bottomBarContent}>
                <TouchableOpacity style={styles.button} onPress={openSearchScreen} accessibilityLabel={t('bottomNav.search')}>
                    <FontAwesomeIcon icon={faSearch} size={fonts.h1 * 0.9} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={openCustomPageModal} accessibilityLabel={t('bottomNav.addCustom')}>
                    <FontAwesomeIcon icon={faPlus} size={fonts.h1 * 0.9} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleHomePress} accessibilityLabel={t('bottomNav.home')}>
                    <FontAwesomeIcon icon={faHome} size={fonts.h1 * 0.9} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={openKeyboardInput} accessibilityLabel={t('bottomNav.keyboard')}>
                    <FontAwesomeIcon icon={faKeyboard} size={fonts.h1 * 0.9} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={openMenu} accessibilityLabel={t('bottomNav.settings')}>
                    <FontAwesomeIcon icon={faCog} size={fonts.h1 * 0.9} color={theme.white} />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
});

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  bottomBarGradient: {
      height: BAR_HEIGHT,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
  },
  bottomBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});

export default BottomBar;