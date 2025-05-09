// src/components/parental/ContentFilteringSection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShieldAlt, faBan, faEyeSlash, faGlobe, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Import TFunction type

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types'; // Ensure this path is correct

// --- Component Props ---
interface ContentFilteringSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigureWeb: () => void;
    t: TFunction<"translation", undefined>; // <-- ADDED: t function prop
}

// --- Component ---
const ContentFilteringSection: React.FC<ContentFilteringSectionProps> = ({
    settings,
    onSettingChange,
    onConfigureWeb,
    t, // <-- Destructure t function
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    return (
        <View style={styles.sectionCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faShieldAlt} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>{t('parentalControls.contentFiltering.sectionTitle')}</Text>
            </View>

            {/* Block Violence */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBan} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>{t('parentalControls.contentFiltering.blockViolenceLabel')}</Text>
                <Switch
                    value={settings.blockViolence}
                    onValueChange={(v) => onSettingChange('blockViolence', v)}
                    {...switchStyles}
                    accessibilityLabel={t('parentalControls.contentFiltering.blockViolenceAccessibilityLabel')}
                    accessibilityState={{ checked: settings.blockViolence }}
                />
            </View>

            {/* Block Inappropriate */}
            <View style={styles.settingRow}>
                 <FontAwesomeIcon icon={faEyeSlash} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>{t('parentalControls.contentFiltering.blockInappropriateLabel')}</Text>
                <Switch
                    value={settings.blockInappropriate}
                    onValueChange={(v) => onSettingChange('blockInappropriate', v)}
                    {...switchStyles}
                    accessibilityLabel={t('parentalControls.contentFiltering.blockInappropriateAccessibilityLabel')}
                    accessibilityState={{ checked: settings.blockInappropriate }}
                />
            </View>

            {/* Web Filtering Link */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onConfigureWeb}
                    activeOpacity={0.6}
                    accessibilityLabel={t('parentalControls.contentFiltering.webFilteringAccessibilityLabel')}
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faGlobe} size={fonts.body} color={theme.textSecondary} style={styles.featureIcon}/>
                    <Text style={styles.featureLabel}>{t('parentalControls.contentFiltering.webFilteringLabel')}</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.disabled} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles (Unchanged from your previous version) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    cardIcon: {
        marginRight: 12,
        // size and color set dynamically
    },
    sectionTitle: {
        fontSize: fonts.h2 * 0.9,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        minHeight: 44,
        paddingHorizontal: 18,
    },
    settingIcon: {
        marginRight: 18,
        width: fonts.body * 1.1, // Base width on font size
        textAlign: 'center',
        // color set dynamically
    },
    settingLabel: {
        flex: 1,
        fontSize: fonts.body,
        color: theme.text,
        marginRight: 10,
    },
    cardFooter: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        minHeight: 44,
        paddingHorizontal: 18,
    },
    featureIcon: {
        marginRight: 18,
        width: fonts.body,
        textAlign: 'center',
    },
    featureLabel: {
        flex: 1,
        fontSize: fonts.body,
        color: theme.textSecondary,
        marginRight: 10,
    },
});

export default ContentFilteringSection;