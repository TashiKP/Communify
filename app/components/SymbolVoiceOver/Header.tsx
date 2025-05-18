import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { ThemeColors, FontSizes } from './types';
import { createThemedStyles } from './styles';

const hitSlop: { top: number; bottom: number; left: number; right: number } = { top: 10, bottom: 10, left: 10, right: 10 };

type HeaderStyles = ReturnType<typeof createThemedStyles>;

interface HeaderProps {
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    isLoading: boolean;
    styles: HeaderStyles;
    theme: ThemeColors;
    fonts: FontSizes;
    t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({
    onClose,
    onSave,
    isSaving,
    hasUnsavedChanges,
    isLoading,
    styles,
    theme,
    fonts,
    t,
}) => {
    const isSaveDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const h2FontSize = fonts.h2 || 20;

    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
                hitSlop={hitSlop}
                accessibilityLabel={t('common.goBack')}
                accessibilityRole="button"
            >
                <FontAwesomeIcon icon={faArrowLeft} size={h2FontSize * 0.7} color={theme.white || '#FFFFFF'} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.white || '#FFFFFF' }]} numberOfLines={1}>
                    {t('voiceSettings.title') || 'Voice Settings'}
                </Text>
            </View>
            <TouchableOpacity
                style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                onPress={onSave}
                disabled={isSaveDisabled}
                hitSlop={hitSlop}
                accessibilityLabel={t('common.save')}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaveDisabled }}
            >
                {isSaving ? (
                    <ActivityIndicator size="small" color={theme.white || '#FFFFFF'} />
                ) : (
                    <FontAwesomeIcon
                        icon={faSave}
                        size={h2FontSize * 0.7}
                        color={isSaveDisabled ? (theme.disabled || '#A0A0A0') : (theme.white || '#FFFFFF')}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

export default React.memo(Header);