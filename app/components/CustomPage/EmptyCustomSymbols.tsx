// src/components/CustomPage/EmptyCustomSymbols.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faThLarge } from '@fortawesome/free-solid-svg-icons';
import { ThemeColors, FontSizes } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';
import { useTranslation } from 'react-i18next';

interface EmptyCustomSymbolsProps {
    theme: ThemeColors;
    fonts: FontSizes;
}

const createStyles = (theme: ThemeColors, fonts: FontSizes, language: string) => {
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, language);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);
    return StyleSheet.create({
        emptyContainer: {
            flex: 1,
            minHeight: Dimensions.get('window').height * 0.6, // Ensure it takes up space
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        emptyText: {
            ...h2Styles,
            fontWeight: '700',
            marginTop: 12,
            textAlign: 'center',
            letterSpacing: 0.3,
            color: theme.text,
        },
        emptySubText: {
            ...bodyStyles,
            fontWeight: '500',
            marginTop: 8,
            textAlign: 'center',
            opacity: 0.7,
            color: theme.textSecondary,
        },
    });
};

const EmptyCustomSymbols: React.FC<EmptyCustomSymbolsProps> = ({ theme, fonts }) => {
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme, fonts, i18n.language), [theme, fonts, i18n.language]);

    return (
        <View style={styles.emptyContainer}>
            <FontAwesomeIcon icon={faThLarge} size={48} color={theme.disabled} />
            <Text style={styles.emptyText}>{t('customPage.noSymbolsTitle')}</Text>
            <Text style={styles.emptySubText}>{t('customPage.noSymbolsSubtitle')}</Text>
        </View>
    );
};

export default EmptyCustomSymbols;