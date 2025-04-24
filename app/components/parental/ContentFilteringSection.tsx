// src/components/parental/ContentFilteringSection.tsx
import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShieldAlt, faBan, faEyeSlash, faGlobe, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types';

// --- Component Props ---
interface ContentFilteringSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigureWeb: () => void;
    // switchStyles and styles props are no longer needed, use context instead
}

// --- Component ---
const ContentFilteringSection: React.FC<ContentFilteringSectionProps> = ({
    settings,
    onSettingChange,
    onConfigureWeb,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
    const switchStyles = useMemo(() => ({ // Generate switch styles from theme
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    return (
        <View style={styles.sectionCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faShieldAlt} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Content Filtering</Text>
            </View>

            {/* Block Violence */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBan} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>Block Violent Content</Text>
                <Switch
                    value={settings.blockViolence}
                    onValueChange={(v) => onSettingChange('blockViolence', v)}
                    {...switchStyles} // Apply themed switch styles
                    accessibilityLabel="Toggle blocking violent content"
                    accessibilityState={{ checked: settings.blockViolence }}
                />
            </View>

            {/* Block Inappropriate */}
            <View style={styles.settingRow}>
                 <FontAwesomeIcon icon={faEyeSlash} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>Block Inappropriate Content</Text>
                <Switch
                    value={settings.blockInappropriate}
                    onValueChange={(v) => onSettingChange('blockInappropriate', v)}
                    {...switchStyles} // Apply themed switch styles
                    accessibilityLabel="Toggle blocking inappropriate content"
                    accessibilityState={{ checked: settings.blockInappropriate }}
                />
            </View>

            {/* Web Filtering Link */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onConfigureWeb}
                    activeOpacity={0.6}
                    accessibilityLabel="Configure web filtering rules"
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faGlobe} size={fonts.body} color={theme.textSecondary} style={styles.featureIcon}/>
                    <Text style={styles.featureLabel}>Web Filtering Rules</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.disabled} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Helper Function for Themed Styles ---
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
        // No margin needed if it's the last element in the card
    },
    featureRow: { // Style for the clickable row in the footer
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        minHeight: 44,
        paddingHorizontal: 18, // Consistent padding
    },
    featureIcon: {
        marginRight: 18,
        width: fonts.body, // Base width on font size
        textAlign: 'center',
        // color set dynamically
    },
    featureLabel: {
        flex: 1,
        fontSize: fonts.body,
        color: theme.textSecondary, // Use secondary color for less emphasis
        marginRight: 10,
    },
    // Chevron color set dynamically
});

export default ContentFilteringSection;