// src/components/parental/UsageReportingSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelopeCircleCheck, faTrash, faPlusCircle, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import {TFunction} from 'i18next';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types'; // Ensure this path is correct

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

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faEnvelopeCircleCheck}
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.usageReporting.sectionTitle')}</Text>
            </View>

            <Text style={styles.infoText}>
                {t('parentalControls.usageReporting.infoText')}
            </Text>

            <View style={styles.emailListContainer}>
                {settings.notifyEmails.length === 0 && !showAddEmailInput && (
                    <Text style={styles.noEmailsText}>{t('parentalControls.usageReporting.noEmailsAdded')}</Text>
                )}
                {settings.notifyEmails.map((email, index) => (
                    <View key={index} style={styles.emailRow}>
                        <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">{email}</Text>
                        <TouchableOpacity
                            onPress={() => onDeleteEmail(email)}
                            style={styles.deleteEmailButton}
                            hitSlop={hitSlop}
                            accessibilityLabel={t('parentalControls.usageReporting.deleteEmailAccessibilityLabel', { email })}
                        >
                            <FontAwesomeIcon icon={faTrash} size={fonts.label * 1.1} color={ERROR_COLOR_HEX} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {showAddEmailInput && (
                <View style={styles.addEmailContainer}>
                    <TextInput
                        style={styles.addEmailInput}
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
                    />
                    <TouchableOpacity
                        style={[styles.addEmailConfirmButton, !newNotifyEmail.trim() && styles.buttonDisabled]}
                        onPress={onAddEmail}
                        disabled={!newNotifyEmail.trim()}
                        accessibilityLabel={t('parentalControls.usageReporting.confirmAddEmailAccessibilityLabel')}
                        accessibilityState={{ disabled: !newNotifyEmail.trim() }}
                    >
                        <FontAwesomeIcon icon={faCheck} size={fonts.body} color={theme.white} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.cardFooter}>
                 <TouchableOpacity style={styles.addEmailToggleButton} onPress={onToggleAddEmail}>
                     <FontAwesomeIcon
                        icon={showAddEmailInput ? faTimes : faPlusCircle}
                        size={fonts.label * 1.1}
                        color={theme.primary}
                        style={styles.buttonIcon}
                    />
                     <Text style={styles.addEmailToggleText}>
                         {showAddEmailInput
                            ? t('parentalControls.usageReporting.cancelAddEmailButton')
                            : t('parentalControls.usageReporting.addEmailButton')}
                     </Text>
                 </TouchableOpacity>
            </View>
        </View>
    );
};

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);

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
            ...labelStyles,
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        infoText: {
            ...captionStyles,
            color: theme.textSecondary,
            paddingVertical: 15,
            textAlign: 'left',
            paddingHorizontal: 18,
        },
        emailListContainer: {
            paddingHorizontal: 18,
            paddingBottom: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            marginTop: 0,
            paddingTop: 10,
        },
        emailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border, // Fallback to standard border
        },
        emailText: {
            ...bodyStyles,
            flex: 1,
            color: theme.text,
            marginRight: 10,
        },
        deleteEmailButton: {
            padding: 5,
        },
        noEmailsText: {
            ...bodyStyles,
            fontStyle: 'italic',
            color: theme.textSecondary,
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
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            marginRight: 10,
            backgroundColor: theme.background,
            color: theme.text,
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
            opacity: 0.5,
        },
        cardFooter: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            paddingVertical: 5,
        },
        addEmailToggleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            justifyContent: 'center',
        },
        buttonIcon: {
            marginRight: 8,
        },
        addEmailToggleText: {
            ...labelStyles,
            color: theme.primary,
            fontWeight: '500',
        },
    });
};

export default UsageReportingSection;