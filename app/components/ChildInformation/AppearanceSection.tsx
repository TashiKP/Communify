import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSun, faMoon, faFont, faTh, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';
import { ChildData } from './types'; // Import the shared type

interface AppearanceSectionProps {
    childData: ChildData;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({ childData }) => {
    const { theme, fonts } = useAppearance();
    const { t } = useTranslation();

    const styles = StyleSheet.create({
        appearanceSectionGradient: {
            padding: 20,
            borderRadius: 12,
        },
        appearanceSettingsContainer: {
            flexDirection: 'column',
        },
        appearanceSettingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        appearanceSettingIcon: {
            marginRight: 10,
        },
        appearanceSettingTextContainer: {
            flex: 1,
            marginRight: 10,
        },
        appearanceSettingLabel: {
            ...getLanguageSpecificTextStyle('body', fonts, 'en'),
            fontSize: (fonts.body || 16) * 0.9,
            fontWeight: '700',
            color: theme.text,
        },
        appearanceSettingValue: {
            ...getLanguageSpecificTextStyle('body', fonts, 'en'),
            fontSize: (fonts.body || 16) * 0.8,
            fontWeight: '500',
            color: theme.textSecondary,
        },
        circularProgressContainer: {
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
        },
        circularProgressBackground: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 999,
            borderWidth: 4,
            borderColor: theme.border,
        },
        circularProgressFill: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 999,
            borderWidth: 4,
            borderColor: 'transparent',
            borderRightColor: theme.primary,
            borderTopColor: theme.primary,
        },
        circularProgressText: {
            ...getLanguageSpecificTextStyle('body', fonts, 'en'),
            fontSize: (fonts.body || 16) * 0.7,
            fontWeight: '600',
        },
    });

    const formatValue = (value: number | undefined): { display: string; percentage: number | undefined } => {
        if (value === undefined) {
            return { display: 'N/A', percentage: undefined };
        }
        const percentage = Math.round(value * 100);
        return { display: `${percentage}%`, percentage };
    };

    const formatBoolean = (value: boolean | undefined) => value !== undefined ? (value ? t('common.yes') : t('common.no')) : 'N/A';
    const capitalize = (str: string | undefined) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : 'N/A';

    const renderCircularProgress = (value: number, size: number = 50) => (
        <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
            <View style={[styles.circularProgressBackground, { backgroundColor: theme.border }]} />
            <View
                style={[styles.circularProgressFill, {
                    backgroundColor: theme.primary,
                    transform: [{ rotate: `${(value / 100) * 360}deg` }],
                }]}
            />
            <Text style={[styles.circularProgressText, { color: theme.text }]}>
                {value}%
            </Text>
        </View>
    );

    const renderAppearanceSetting = (
        label: string,
        value: string,
        icon: any,
        percentageValue?: number
    ) => (
        <View style={styles.appearanceSettingItem}>
            <FontAwesomeIcon icon={icon} size={fonts.body} color={theme.primary} style={styles.appearanceSettingIcon} />
            <View style={styles.appearanceSettingTextContainer}>
                <Text style={styles.appearanceSettingLabel}>{label}</Text>
                {percentageValue === undefined && (
                    <Text style={styles.appearanceSettingValue}>{value}</Text>
                )}
            </View>
            {percentageValue !== undefined && renderCircularProgress(percentageValue)}
        </View>
    );

    return (
        <LinearGradient
            colors={[theme.card, theme.background]}
            style={styles.appearanceSectionGradient}
        >
            <View style={styles.appearanceSettingsContainer}>
                {renderAppearanceSetting(
                    t('childInformation.brightness'),
                    formatValue(childData?.appearanceSettings?.brightness ? childData.appearanceSettings.brightness / 100 : undefined).display,
                    faSun,
                    formatValue(childData?.appearanceSettings?.brightness ? childData.appearanceSettings.brightness / 100 : undefined).percentage
                )}
                {renderAppearanceSetting(
                    t('childInformation.darkMode'),
                    formatBoolean(childData?.appearanceSettings?.dark_mode_enabled),
                    faMoon
                )}
                {renderAppearanceSetting(
                    t('childInformation.fontSize'),
                    childData?.appearanceSettings?.font_size ? capitalize(childData.appearanceSettings.font_size) : 'N/A',
                    faFont
                )}
                {renderAppearanceSetting(
                    t('childInformation.gridLayout'),
                    childData?.appearanceSettings?.symbol_grid_layout ? capitalize(childData.appearanceSettings.symbol_grid_layout) : 'N/A',
                    faTh
                )}
                {renderAppearanceSetting(
                    t('childInformation.ttsHighlightWord'),
                    formatBoolean(childData?.appearanceSettings?.tts_highlight_word),
                    faVolumeUp
                )}
                {renderAppearanceSetting(
                    t('childInformation.ttsPitch'),
                    formatValue(childData?.appearanceSettings?.tts_pitch).display,
                    faVolumeUp,
                    formatValue(childData?.appearanceSettings?.tts_pitch).percentage
                )}
                {renderAppearanceSetting(
                    t('childInformation.ttsSpeed'),
                    formatValue(childData?.appearanceSettings?.tts_speed).display,
                    faVolumeUp,
                    formatValue(childData?.appearanceSettings?.tts_speed).percentage
                )}
                {renderAppearanceSetting(
                    t('childInformation.ttsVolume'),
                    formatValue(childData?.appearanceSettings?.tts_volume).display,
                    faVolumeUp,
                    formatValue(childData?.appearanceSettings?.tts_volume).percentage
                )}
            </View>
        </LinearGradient>
    );
};

export default AppearanceSection;