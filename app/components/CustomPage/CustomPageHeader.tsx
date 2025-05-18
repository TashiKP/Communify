// src/components/CustomPage/CustomPageHeader.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ThemeColors, FontSizes } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';
import { hitSlop } from './constants';
import { useTranslation } from 'react-i18next';

interface CustomPageHeaderProps {
    onBackPress: () => void;
    onAddPress: () => void;
    title: string;
    isLoading?: boolean;
    theme: ThemeColors;
    fonts: FontSizes;
}

const createStyles = (theme: ThemeColors, fonts: FontSizes, language: string) => {
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, language);
    return StyleSheet.create({
        headerBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            // Removed width: '100%' as it's typically handled by parent container
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
        },
        headerTitle: {
            ...h2Styles,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: 0.5,
            color: theme.white,
        },
    });
};

const CustomPageHeader: React.FC<CustomPageHeaderProps> = ({
    onBackPress,
    onAddPress,
    title,
    isLoading,
    theme,
    fonts,
}) => {
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme, fonts, i18n.language), [theme, fonts, i18n.language]);

    return (
        <View style={styles.headerBar}>
            <TouchableOpacity onPress={onBackPress} hitSlop={hitSlop} activeOpacity={0.6} accessibilityLabel={t('common.goBack')} accessibilityRole="button">
                <FontAwesomeIcon icon={faArrowLeft} size={fonts.body * 1.2} color={theme.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onAddPress} hitSlop={hitSlop} disabled={isLoading} activeOpacity={0.6} accessibilityLabel={t('customPage.addSymbolAccessibilityLabel')} accessibilityRole="button">
                <FontAwesomeIcon icon={faPlus} size={fonts.body * 1.2} color={isLoading ? theme.disabled : theme.white} />
            </TouchableOpacity>
        </View>
    );
};

export default CustomPageHeader;