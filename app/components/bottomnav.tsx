// src/components/bottomnav.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Text // Removed Easing, Platform for this simplified version
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faHome, faKeyboard, faCog // faBoxes removed as it wasn't used
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// Types (assuming they are correctly defined elsewhere or can be simplified for this example)
import { VoiceSettingData } from './SymbolVoiceOverScreen'; // Adjust path
// import { GridLayoutType } from '../context/GridContext'; // Not used if Menu in HomeScreen handles grid

// --- Constants ---
const BAR_HEIGHT = 65;

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void;
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void; // Called when search in BottomBar selects
    onTextInputSubmit: (text: string) => void; // Called when keyboard in BottomBar submits
    currentLanguage?: string;
    // onGridLayoutSave?: (layout: GridLayoutType) => void; // If Menu in BottomBar were to save layout
    onCustomSymbolsUpdate?: (symbols: any[]) => void; // If CustomPage in BottomBar updates symbols
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void; // For Menu in BottomBar

    // Functions passed from HomeScreen to control modals rendered in HomeScreen
    openMenu: () => void;
    openSearchScreen: () => void;
    openCustomPageModal: () => void;
    openKeyboardInput: () => void;
};

// --- Component ---
const BottomBar: React.FC<BottomBarProps> = React.memo(({
    handleHomePress,
    // onSymbolSelected, // This would be used if SearchScreen was a child of BottomBar
    // onTextInputSubmit, // This would be used if KeyboardInput was a child of BottomBar
    currentLanguage = 'en',
    // onCustomSymbolsUpdate, // This would be used if CustomPageComponent was a child of BottomBar
    // currentTtsSettings, // Used if Menu was a child of BottomBar
    // onTtsSettingsSave, // Used if Menu was a child of BottomBar

    // Props from HomeScreen to trigger modal openings
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