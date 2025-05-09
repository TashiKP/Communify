// src/components/AboutScreen.tsx
import React, { useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Linking, Alert, Image,
    ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faUsers, faEnvelope, faGlobe,
    faBuilding,
    faCodeBranch,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';

// --- Props Interface ---
interface AboutScreenProps {
  onClose: () => void;
  appNameProp?: string;
  appVersionProp?: string;
  buildNumberProp?: string;
  contactEmail?: string;
  websiteUrl?: string;
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const DZONGKHA_FONT_FAMILY = 'Jomolhari-Regular'; // The PostScript name of your Dzongkha font

// --- Component ---
const AboutScreen: React.FC<AboutScreenProps> = ({
  onClose,
  appNameProp,
  appVersionProp,
  buildNumberProp,
  contactEmail: contactEmailProp,
  websiteUrl: websiteUrlProp,
}) => {
    // --- Hooks ---
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language; // Get current language

    // --- Dynamic Styles ---
    // Pass currentLanguage to styles so it can apply font conditionally
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // --- App Info ---
    const appName = appNameProp || t('appName');
    const appVersion = appVersionProp || '1.0.0';
    const buildNumber = buildNumberProp || '1';
    const contactEmail = contactEmailProp || t('aboutScreen.defaultContactEmail');
    const websiteUrl = websiteUrlProp || t('aboutScreen.defaultWebsiteUrl');

    // --- Handlers ---
    const handleOpenLink = async (url: string | undefined, type: 'email' | 'web') => {
        // ... (handler logic remains the same, already uses t()) ...
    };

    // --- Render Guard for i18n ---
    if (!i18n.isInitialized || typeof t !== 'function') {
        return (
            <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center'}]}>
                 <ActivityIndicator size="large" color={theme.white || '#FFFFFF'} />
                 <Text style={{ color: theme.white || '#FFFFFF', marginTop: 15, fontSize: fonts.body || 16 }}>Loading Interface...</Text>
             </SafeAreaView>
         );
     }

  return (
    <SafeAreaView style={styles.screenContainer}>
        {/* Screen Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={hitSlop} accessibilityLabel={t('common.goBack')}>
            <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{t('aboutScreen.title')}</Text>
          </View>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {/* Scrollable Content */}
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {/* App Info Card */}
            <View style={styles.appInfoCard}>
                 <Text style={styles.appName}>{appName}</Text>
                 <View style={styles.versionContainer}>
                    <FontAwesomeIcon icon={faCodeBranch} size={fonts.caption} color={theme.textSecondary} style={styles.versionIcon}/>
                    <Text style={styles.appVersion}>
                        {t('aboutScreen.versionLabel', { version: appVersion, build: buildNumber })}
                    </Text>
                 </View>
            </View>

            {/* Mission Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faBuilding} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>{t('aboutScreen.missionTitle')}</Text>
                </View>
                <Text style={styles.paragraph}>
                    {t('aboutScreen.missionText')}
                </Text>
            </View>

            {/* Team Card */}
             <View style={styles.card}>
                 <View style={styles.cardHeader}>
                    <FontAwesomeIcon icon={faUsers} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>{t('aboutScreen.teamTitle')}</Text>
                 </View>
                <Text style={styles.paragraph}>
                    {t('aboutScreen.teamText')}
                </Text>
             </View>

             {/* Links Card */}
            <View style={styles.card}>
                 <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faGlobe} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>{t('aboutScreen.connectTitle')}</Text>
                 </View>

                 {websiteUrl && (
                    <TouchableOpacity
                        style={[styles.linkRow, !contactEmail && styles.linkRowLast]}
                        onPress={() => handleOpenLink(websiteUrl, 'web')}
                        accessibilityRole="link"
                        accessibilityLabel={t('aboutScreen.websiteAccessibilityLabel')}
                     >
                        <FontAwesomeIcon icon={faGlobe} size={fonts.body} color={theme.primary} style={styles.linkIcon} />
                        <Text style={styles.linkText}>{t('aboutScreen.websiteLinkText')}</Text>
                        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.textSecondary} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}

                 {contactEmail && (
                    <TouchableOpacity
                        style={[styles.linkRow, styles.linkRowLast]}
                        onPress={() => handleOpenLink(contactEmail, 'email')}
                        accessibilityRole="link"
                        accessibilityLabel={t('aboutScreen.contactAccessibilityLabel')}
                    >
                         <FontAwesomeIcon icon={faEnvelope} size={fonts.body} color={theme.primary} style={styles.linkIcon} />
                        <Text style={styles.linkText}>{t('aboutScreen.contactLinkText')}</Text>
                         <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.textSecondary} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}
            </View>

            {/* Footer / Copyright */}
             <Text style={styles.footerText}>
                {t('aboutScreen.footerText', { year: new Date().getFullYear(), appName: appName })}
             </Text>
        </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, language: string) => {
    // Define base styles that might be common
    const baseTextStyle = {
        color: theme.text,
        // Default font can be set here or let it be system default
    };

    const dzongkhaTextStyle = language === 'dzo' ? {
        fontFamily: DZONGKHA_FONT_FAMILY,
        // Potentially adjust line height specifically for Dzongkha if needed globally for these text types
        // lineHeight: fonts.body * 1.8, // Example for increased line height
    } : {};

    return StyleSheet.create({
      screenContainer: { flex: 1, backgroundColor: theme.primary, },
      header: { paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 15, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.primary, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
      titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
      title: {
          fontSize: fonts.h2,
          fontWeight: 'bold',
          color: theme.white,
          textAlign: 'center',
          ...(language === 'dzo' && { fontFamily: DZONGKHA_FONT_FAMILY, lineHeight: fonts.h2 * 1.4 }), // Apply Dzongkha font & adjust line height
      },
      headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
      headerButtonPlaceholder: { minWidth: 44, minHeight: 44, },
      scrollContentContainer: { flexGrow: 1, backgroundColor: theme.background, padding: 20, paddingBottom: 30, },
      appInfoCard: { alignItems: 'center', paddingVertical: 25, backgroundColor: theme.card, borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, },
      logo: { width: 80, height: 80, borderRadius: 15, marginBottom: 15, },
      appName: {
          ...baseTextStyle,
          fontSize: fonts.h1,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 6,
          ...dzongkhaTextStyle, // Apply Dzongkha font
          ...(language === 'dzo' && { lineHeight: fonts.h1 * 1.3 }), // Specific line height for appName if needed
      },
      versionContainer: { flexDirection: 'row', alignItems: 'center', opacity: 0.8, },
      versionIcon: { marginRight: 5, },
      appVersion: {
          fontSize: fonts.caption,
          color: theme.textSecondary,
          textAlign: 'center',
          ...(language === 'dzo' && { fontFamily: DZONGKHA_FONT_FAMILY }), // Apply Dzongkha font
      },
      card: { backgroundColor: theme.card, borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, },
      cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, },
      cardIcon: { marginRight: 12, },
      cardTitle: {
          ...baseTextStyle,
          fontSize: fonts.h2,
          fontWeight: '600',
          flex: 1,
          ...dzongkhaTextStyle,
          ...(language === 'dzo' && { lineHeight: fonts.h2 * 1.4 }), // Adjusted line height for Dzongkha titles
      },
      paragraph: {
          ...baseTextStyle,
          fontSize: fonts.body,
          color: theme.textSecondary,
          lineHeight: language === 'dzo' ? fonts.body * 1.8 : fonts.body * 1.5, // Increased for Dzo
          textAlign: 'left',
          ...dzongkhaTextStyle,
      },
      linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, },
      linkRowLast: { borderBottomWidth: 0, },
      linkIcon: { marginRight: 15, width: 20, textAlign: 'center', },
      linkText: {
          fontSize: fonts.label,
          color: theme.primary,
          fontWeight: '500',
          flex: 1, // Allow text to take space
          ...(language === 'dzo' && { fontFamily: DZONGKHA_FONT_FAMILY, lineHeight: fonts.label * 1.4 }), // Font and line height for links
      },
      linkChevron: { marginLeft: 10, color: theme.textSecondary, },
      footerText: {
          marginTop: 20, paddingBottom: 10, fontSize: fonts.caption,
          color: theme.textSecondary, textAlign: 'center', opacity: 0.8,
          ...(language === 'dzo' && { fontFamily: DZONGKHA_FONT_FAMILY, lineHeight: fonts.caption * 1.4 }),
      },
    });
};

export default AboutScreen;