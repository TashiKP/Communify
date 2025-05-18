import React, {useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUsers,
  faEnvelope,
  faGlobe,
  faBuilding,
  faCodeBranch,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets, EdgeInsets} from 'react-native-safe-area-context';

// --- Import Appearance Context ---
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext';
// --- Import Typography Utility ---
import {getLanguageSpecificTextStyle} from '../styles/typography';

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
const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};

// --- Component ---
const AboutScreen: React.FC<AboutScreenProps> = ({
  onClose,
  appNameProp,
  appVersionProp,
  buildNumberProp,
  contactEmail: contactEmailProp,
  websiteUrl: websiteUrlProp,
}) => {
  const {theme, fonts} = useAppearance();
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;
  const insets = useSafeAreaInsets();

  // Styles now use the getLanguageSpecificTextStyle utility
  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage, insets),
    [theme, fonts, currentLanguage, insets],
  );

  const appName = appNameProp || t('appName');
  const appVersion = appVersionProp || '1.0.0';
  const buildNumber = buildNumberProp || '1';
  const contactEmail = contactEmailProp || t('aboutScreen.defaultContactEmail');
  const websiteUrl = websiteUrlProp || t('aboutScreen.defaultWebsiteUrl');

  const handleOpenLink = useCallback(
    async (url: string | undefined, type: 'email' | 'web') => {
      if (!url) return;
      if (type === 'email' && !url.includes('@')) {
        Alert.alert(t('common.error'), t('aboutScreen.errors.invalidEmail'));
        return;
      }
      if (
        type === 'web' &&
        !url.startsWith('http://') &&
        !url.startsWith('https://')
      ) {
        url = `https://${url}`;
      }
      const finalUrl = type === 'email' ? `mailto:${url}` : url;
      try {
        const canOpen = await Linking.canOpenURL(finalUrl);
        if (canOpen) {
          await Linking.openURL(finalUrl);
        } else {
          Alert.alert(
            t('common.error'),
            type === 'email'
              ? t('aboutScreen.errors.noEmailClient')
              : t('aboutScreen.errors.noBrowser'),
          );
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('aboutScreen.errors.linkOpenFail'));
        console.error(`Failed to open ${type} link: ${finalUrl}`, error);
      }
    },
    [t],
  );

  if (!i18n.isInitialized || typeof t !== 'function') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0077b6',
        }}>
        <ActivityIndicator size="large" color={'#FFFFFF'} />
        <Text style={{color: '#FFFFFF', marginTop: 15, fontSize: 16}}>
          Loading Interface...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onClose}
          hitSlop={hitSlop}
          accessibilityLabel={t('common.goBack')}
          accessibilityRole="button">
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={fonts.h2 * 0.7}
            color={theme.white}
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, {color: theme.white}]}
            numberOfLines={2}
            ellipsizeMode="tail">
            {t('aboutScreen.title')}
          </Text>
        </View>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.appInfoCard}>
          <Text
            style={[styles.appName, {color: theme.text}]}
            accessibilityLabel={`${appName} application name`}
            accessibilityRole="header">
            {appName}
          </Text>
          <View style={styles.versionContainer}>
            <FontAwesomeIcon
              icon={faCodeBranch}
              size={fonts.body * 1.1}
              color={theme.textSecondary}
              style={styles.versionIcon}
            />
            <Text
              style={[styles.appVersion, {color: theme.textSecondary}]}
              accessibilityLabel={t('aboutScreen.versionLabel', {
                version: appVersion,
                build: buildNumber,
              })}>
              {t('aboutScreen.versionLabel', {
                version: appVersion,
                build: buildNumber,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesomeIcon
              icon={faBuilding}
              size={fonts.body * 1.1}
              color={theme.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.cardTitle, {color: theme.text}]}>
              {t('aboutScreen.missionTitle')}
            </Text>
          </View>
          <Text style={[styles.paragraph, {color: theme.textSecondary}]}>
            {t('aboutScreen.missionText')}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesomeIcon
              icon={faUsers}
              size={fonts.body * 1.1}
              color={theme.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.cardTitle, {color: theme.text}]}>
              {t('aboutScreen.teamTitle')}
            </Text>
          </View>
          <Text style={[styles.paragraph, {color: theme.textSecondary}]}>
            {t('aboutScreen.teamText')}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesomeIcon
              icon={faGlobe}
              size={fonts.body * 1.1}
              color={theme.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.cardTitle, {color: theme.text}]}>
              {t('aboutScreen.connectTitle')}
            </Text>
          </View>

          {websiteUrl && (
            <TouchableOpacity
              style={[styles.linkRow, !contactEmail && styles.linkRowLast]}
              onPress={() => handleOpenLink(websiteUrl, 'web')}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel={t('aboutScreen.websiteAccessibilityLabel')}>
              <FontAwesomeIcon
                icon={faGlobe}
                size={fonts.body * 1.1}
                color={theme.primary}
                style={styles.linkIcon}
              />
              <Text style={[styles.linkText, {color: theme.primary}]}>
                {t('aboutScreen.websiteLinkText')}
              </Text>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={fonts.body}
                color={theme.textSecondary}
                style={styles.linkChevron}
              />
            </TouchableOpacity>
          )}

          {contactEmail && (
            <TouchableOpacity
              style={[styles.linkRow, styles.linkRowLast]}
              onPress={() => handleOpenLink(contactEmail, 'email')}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel={t('aboutScreen.contactAccessibilityLabel')}>
              <FontAwesomeIcon
                icon={faEnvelope}
                size={fonts.body * 1.1}
                color={theme.primary}
                style={styles.linkIcon}
              />
              <Text style={[styles.linkText, {color: theme.primary}]}>
                {t('aboutScreen.contactLinkText')}
              </Text>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={fonts.body}
                color={theme.textSecondary}
                style={styles.linkChevron}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={[styles.footerText, {color: theme.textSecondary}]}
          accessibilityLabel={t('aboutScreen.footerText', {
            year: new Date().getFullYear(),
            appName,
          })}>
          {t('aboutScreen.footerText', {
            year: new Date().getFullYear(),
            appName,
          })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  language: string,
  insets: EdgeInsets,
) => {
  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, language);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.primary,
    },
    header: {
      paddingTop: (Platform.OS === 'android' ? 15 : 10) + insets.top,
      paddingBottom: 15,
      paddingHorizontal: 10 + Math.max(insets.left, insets.right),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    title: {
      ...h2Styles,
      fontWeight: '600',
      textAlign: 'center',
    },
    headerButton: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerButtonPlaceholder: {
      minWidth: 44,
      minHeight: 44,
    },
    scrollContentContainer: {
      flexGrow: 1,
      backgroundColor: theme.background,
      padding: 20,
      paddingBottom: 30 + insets.bottom,
      paddingLeft: 20 + insets.left,
      paddingRight: 20 + insets.right,
    },
    appInfoCard: {
      alignItems: 'center',
      paddingVertical: 25,
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    appName: {
      ...h2Styles,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 6,
    },
    versionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      opacity: 0.8,
    },
    versionIcon: {
      marginRight: 5,
    },
    appVersion: {
      ...bodyStyles,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 18,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    cardIcon: {
      marginRight: 12,
    },
    cardTitle: {
      ...h2Styles,
      fontWeight: '600',
      flex: 1,
    },
    paragraph: {
      ...bodyStyles,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      minHeight: 44,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    linkRowLast: {
      borderBottomWidth: 0,
    },
    linkIcon: {
      marginRight: 15,
      width: fonts.body * 1.1,
      textAlign: 'center',
    },
    linkText: {
      ...bodyStyles,
      fontWeight: '500',
      flex: 1,
    },
    linkChevron: {
      marginLeft: 10,
    },
    footerText: {
      ...bodyStyles,
      marginTop: 20,
      paddingBottom: 10,
      textAlign: 'center',
      opacity: 0.8,
    },
  });
};

export default AboutScreen;
