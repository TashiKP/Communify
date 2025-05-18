import { StyleSheet, Platform } from 'react-native';
import { ThemeColors, FontSizes } from './types';
import { getLanguageSpecificTextStyle } from '../../styles/typography';

export const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const h2FontSize = fonts.h2 || 20; // Fallback retained for safety
    const bodyFontSize = fonts.body || 16;
    const labelFontSize = fonts.label || 14;

    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

    return StyleSheet.create({
        screenContainer: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        header: {
            backgroundColor: theme.primary,
            paddingTop: Platform.OS === 'android' ? 10 : 0,
            paddingBottom: 12,
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        titleContainer: {
            flex: 1,
            alignItems: 'center',
            marginHorizontal: 5,
        },
        title: {
            ...h2Styles,
            fontSize: h2FontSize,
            fontWeight: '700',
            textAlign: 'center',
            color: theme.white,
        },
        headerButton: {
            padding: 10,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContentContainer: {
            flexGrow: 1,
            backgroundColor: theme.background,
            padding: 18,
            paddingBottom: 40,
        },
        sectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 18,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            shadowColor: theme.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.2 : 0.08,
            shadowRadius: 2,
            elevation: 1,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        sectionIcon: {
            marginRight: 12,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        sectionTitle: {
            ...labelStyles,
            fontSize: labelFontSize,
            fontWeight: '700',
            flex: 1,
            color: theme.text,
        },
        settingItem: {
            marginBottom: 15,
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '700',
            color: theme.text,
        },
        sliderControlRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 5,
        },
        lockButton: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginRight: 10,
        },
        slider: {
            flex: 1,
            height: 40,
        },
        valueText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            minWidth: 80,
            textAlign: 'center',
            marginLeft: 14,
            color: theme.primary,
        },
        switchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            marginTop: 15,
        },
        switchLabelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: 10,
        },
        switchIcon: {
            marginRight: 15,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        switchLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '700',
            color: theme.text,
        },
        pickerContainer: {
            borderWidth: 1.5,
            borderColor: theme.border,
            borderRadius: 10,
            backgroundColor: theme.card,
            marginTop: 10,
            marginBottom: 5,
            overflow: 'hidden',
        },
        picker: {
            height: Platform.OS === 'ios' ? 200 : 50,
            color: theme.text,
        },
        pickerItem: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            color: theme.text,
        },
        errorText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            textAlign: 'center',
            marginVertical: 15,
            paddingHorizontal: 10,
            color: '#dc3545',
        },
        infoTextSmall: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 5,
            color: theme.textSecondary,
        },
        actionsContainer: {
            marginTop: 25,
            alignItems: 'center',
        },
        previewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.primary,
            backgroundColor: theme.primary,
            minWidth: 150,
            minHeight: 44,
            marginTop: 10,
        },
        previewButtonText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '600',
            textAlign: 'center',
        },
        resetButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        resetButtonText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            textDecorationLine: 'underline',
            color: theme.textSecondary,
        },
        buttonIcon: {
            marginRight: 6,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        textDisabled: {
            textDecorationLine: 'none',
        },
        loadingText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            marginTop: 15,
            textAlign: 'center',
            color: theme.text,
        },
    });
};