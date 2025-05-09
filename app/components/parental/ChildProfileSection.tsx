// src/components/parental/ChildProfileSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Import TFunction type

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData, AsdLevel } from './types'; // Assuming types are moved

// --- Component Props ---
interface ChildProfileSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    t: TFunction<"translation", undefined>; // <-- ADDED: t function prop
}

// --- Component ---
const ChildProfileSection: React.FC<ChildProfileSectionProps> = ({
    settings,
    onSettingChange,
    t, // <-- Destructure t function
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Profile Options Data (Labels will use t function) ---
    const profileOptions: { level: AsdLevel; labelKey: string; icon: any }[] = [
        { level: 'high', labelKey: "parentalControls.childProfile.level3Label", icon: faHeart },
        { level: 'medium', labelKey: "parentalControls.childProfile.level2Label", icon: faChild },
        { level: 'low', labelKey: "parentalControls.childProfile.level1Label", icon: faUserShield },
        { level: 'noAsd', labelKey: "parentalControls.childProfile.noNeedsLabel", icon: faUserShield }
    ];

    return (
        <View style={styles.sectionCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faChild} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>{t('parentalControls.childProfile.sectionTitle')}</Text>
             </View>
             {/* Info Text */}
             <Text style={styles.infoText}>{t('parentalControls.childProfile.infoText')}</Text>
            {/* Options List */}
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, labelKey, icon }) => {
                    const isSelected = settings.asdLevel === level;
                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const labelStyle = isSelected ? styles.optionLabelSelected : styles.optionLabel;
                    const radioOuterStyle = isSelected ? styles.radioOuterSelected : styles.radioOuter;
                    const label = t(labelKey); // Get translated label

                    return (
                        <TouchableOpacity
                            key={level}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => onSettingChange('asdLevel', level)}
                            activeOpacity={0.8}
                            accessibilityLabel={t('parentalControls.childProfile.optionAccessibilityLabel', { profile: label })}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                        >
                             <FontAwesomeIcon icon={icon} size={fonts.body * 1.2} color={iconColor} style={styles.optionIcon}/>
                            <Text style={labelStyle}>{label}</Text>
                            {/* Custom Radio Button Visual */}
                            <View style={radioOuterStyle}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Clear Button */}
                {settings.asdLevel !== null && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => onSettingChange('asdLevel', null)}
                        accessibilityLabel={t('parentalControls.childProfile.clearAccessibilityLabel')}
                        accessibilityRole="button"
                    >
                        <Text style={styles.clearButtonText}>{t('parentalControls.childProfile.clearButtonText')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Styles (Unchanged from your previous version) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: { backgroundColor: theme.card, borderRadius: 12, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, overflow: 'hidden', },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, },
    cardIcon: { marginRight: 12, },
    sectionTitle: { fontSize: fonts.h2 * 0.9, fontWeight: '600', color: theme.text, flex: 1, },
    infoText: { fontSize: fonts.caption, color: theme.textSecondary, paddingVertical: 15, textAlign: 'left', paddingHorizontal: 18, },
    optionsList: { paddingHorizontal: 18, paddingBottom: 10, },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border, marginBottom: 10, },
    optionCardSelected: { borderColor: theme.primary, backgroundColor: theme.primaryMuted, },
    optionIcon: { marginRight: 15, width: fonts.body * 1.2, textAlign: 'center', },
    optionLabel: { flex: 1, fontSize: fonts.body, fontWeight: '500', color: theme.text, },
    optionLabelSelected: { flex: 1, fontSize: fonts.body, fontWeight: 'bold', color: theme.primary, },
    radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginLeft: 10, },
    radioOuterSelected: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 10, },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: theme.primary, },
    clearButton: { marginTop: 5, marginBottom: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12, },
    clearButtonText: { fontSize: fonts.label, color: theme.primary, fontWeight: '500', },
});

export default ChildProfileSection;