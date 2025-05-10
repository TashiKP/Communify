import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelopeCircleCheck, faTrash, faPlusCircle, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography';

// --- Import Local Types ---
import { ParentalSettingsData } from './types';

// --- Component Props ---
interface UsageReportingSectionProps {
    settings: ParentalSettingsData;
    showAddEmailInput: boolean;
    newNotifyEmail: string;
    onNewEmailChange: (text: string) => void;
    onToggleAddEmail: () => void;
    onAddEmail: () => void;
    onDeleteEmail: (emailToDelete: string) => void;
    t: TFunction<"translation", undefined>;
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const ERROR_COLOR_HEX = '#dc3545';

// --- Component ---
const UsageReportingSection: React.FC<UsageReportingSectionProps> = ({
    settings,
    showAddEmailInput,
    newNotifyEmail,
    onNewEmailChange,
    onToggleAddEmail,
    onAddEmail,
    onDeleteEmail,
    t,
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
}) => {
    const { theme, fonts } = useAppearance();
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // Determine colors for dynamic styling
    const addEmailButtonTextColor = showAddEmailInput ? theme.textSecondary : theme.primary;
    const addEmailButtonIconColor = addEmailButtonTextColor;

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faEnvelopeCircleCheck}
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.usageReporting.sectionTitle')}</Text>
            </View>

            {/* Info Text */}
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('parentalControls.usageReporting.infoText')}
            </Text>

            {/* Email List */}
            <View style={styles.emailListContainer}>
                {settings.notifyEmails.length === 0 && !showAddEmailInput && (
                    <Text style={[styles.noEmailsText, { color: theme.textSecondary }]}>
                        {t('parentalControls.usageReporting.noEmailsAdded')}
                    </Text>
                )}
                {settings.notifyEmails.map((email, index) => (
                    <View key={index} style={styles.emailRow}>
                        <Text style={[styles.emailText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                            {email}
                        </Text>
                        <TouchableOpacity
                            onPress={() => onDeleteEmail(email)}
                            style={styles.deleteEmailButton}
                            hitSlop={hitSlop}
                            accessibilityLabel={t('parentalControls.usageReporting.deleteEmailAccessibilityLabel', { email })}
                            accessibilityRole="button"
                        >
                            <FontAwesomeIcon icon={faTrash} size={fonts.body * 1.1} color={ERROR_COLOR_HEX} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Add Email Input */}
            {showAddEmailInput && (
                <View style={styles.addEmailContainer}>
                    <TextInput
                        style={[styles.addEmailInput, { color: theme.text, borderColor: theme.border }]}
                        placeholder={t('parentalControls.usageReporting.emailInputPlaceholder')}
                        placeholderTextColor={theme.disabled}
                        value={newNotifyEmail}
                        onChangeText={onNewEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={onAddEmail}
                        autoFocus={true}
                        selectionColor={theme.primary}
                        keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                        accessibilityLabel={t('parentalControls.usageReporting.emailInputAccessibilityLabel')}
                    />
                    <TouchableOpacity
                        style={[styles.addEmailConfirmButton, !newNotifyEmail.trim() && styles.buttonDisabled]}
                        onPress={onAddEmail}
                        disabled={!newNotifyEmail.trim()}
                        accessibilityLabel={t('parentalControls.usageReporting.confirmAddEmailAccessibilityLabel')}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !newNotifyEmail.trim() }}
                    >
                        <FontAwesomeIcon icon={faCheck} size={fonts.body} color={theme.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Footer with Add/Cancel Button */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.addEmailToggleButton}
                    onPress={onToggleAddEmail}
                    activeOpacity={0.7}
                    accessibilityLabel={
                        showAddEmailInput
                            ? t('parentalControls.usageReporting.cancelAddEmailAccessibilityLabel')
                            : t('parentalControls.usageReporting.addEmailAccessibilityLabel')
                    }
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon
                        icon={showAddEmailInput ? faTimes : faPlusCircle}
                        size={fonts.body * 1.1}
                        color={addEmailButtonIconColor}
                        style={styles.buttonIcon}
                    />
                    <Text style={[styles.addEmailToggleText, { color: addEmailButtonTextColor }]}>
                        {showAddEmailInput
                            ? t('parentalControls.usageReporting.cancelAddEmailButton')
                            : t('parentalControls.usageReporting.addEmailButton')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);

    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: 'hidden',
        },
        defaultCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 15,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        defaultCardIcon: {
            marginRight: 12,
        },
        defaultSectionTitle: {
            ...h2Styles,
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        infoText: {
            ...bodyStyles,
            paddingVertical: 15,
            textAlign: 'left',
            paddingHorizontal: 18,
        },
        emailListContainer: {
            paddingHorizontal: 18,
            paddingBottom: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            paddingTop: 10,
        },
        emailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            minHeight: 44,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        emailText: {
            ...bodyStyles,
            flex: 1,
            marginRight: 10,
        },
        deleteEmailButton: {
            padding: 5,
        },
        noEmailsText: {
            ...bodyStyles,
            fontStyle: 'italic',
            textAlign: 'center',
            paddingVertical: 15,
        },
        addEmailContainer: {
            flexDirection: 'row',
            paddingHorizontal: 18,
            paddingVertical: 15,
            alignItems: 'center',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
        },
        addEmailInput: {
            ...bodyStyles,
            flex: 1,
            height: 44,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            marginRight: 10,
            backgroundColor: theme.background,
        },
        addEmailConfirmButton: {
            backgroundColor: theme.primary,
            padding: 10,
            height: 44,
            width: 44,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        cardFooter: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            paddingVertical: 5,
        },
        addEmailToggleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            minHeight: 44,
            paddingHorizontal: 18,
        },
        buttonIcon: {
            marginRight: 8,
        },
        addEmailToggleText: {
            ...bodyStyles,
            fontWeight: '500',
        },
    });
};

export default UsageReportingSection;