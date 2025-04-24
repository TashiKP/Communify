// src/components/AboutScreen.tsx
import React, { useMemo } from 'react'; // Added useMemo
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Linking, Alert, Image
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faUsers, faEnvelope, faGlobe,
    faBuilding,
    faCodeBranch,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Props Interface ---
interface AboutScreenProps {
  onClose: () => void;
  appName?: string;
  appVersion?: string;
  buildNumber?: string;
  contactEmail?: string;
  websiteUrl?: string;
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const AboutScreen: React.FC<AboutScreenProps> = ({
  onClose,
  appName: appNameProp = 'Communify',
  appVersion: appVersionProp = '1.0.0',
  buildNumber: buildNumberProp = '1',
  contactEmail = 'support@communify.app',
  websiteUrl = 'https://communify.app',
}) => {
    // --- Consume Appearance Context ---
    const { theme, fonts } = useAppearance();

    // --- Use Theme and Fonts in Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- App Info (remains the same logic) ---
    const appName = appNameProp; // || DeviceInfo.getApplicationName();
    const appVersion = appVersionProp; // || DeviceInfo.getVersion();
    const buildNumber = buildNumberProp; // || DeviceInfo.getBuildNumber();

    // --- Handlers (remains the same logic) ---
    const handleOpenLink = async (url: string | undefined, type: 'email' | 'web') => {
        if (!url) return;
        const finalUrl = type === 'email' ? `mailto:${url}` : url;
        try {
            const canOpen = await Linking.canOpenURL(finalUrl);
            if (canOpen) {
                await Linking.openURL(finalUrl);
            } else {
                Alert.alert('Error', `Could not open ${type === 'email' ? 'email client' : 'link'}. Please check if you have a ${type === 'email' ? 'mail app' : 'web browser'} installed.`);
                console.warn(`Cannot open URL: ${finalUrl}`);
            }
        } catch (error) {
             Alert.alert('Error', `An error occurred while trying to open the link.`);
             console.error("Linking error:", error);
        }
    };

  return (
    // Use theme primary color for SafeAreaView to color notch area
    <SafeAreaView style={styles.screenContainer}>
        {/* Screen Header - Use solid theme color */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={hitSlop} accessibilityLabel="Go back">
            <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>About</Text>
          </View>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {/* Scrollable Content - Uses theme background */}
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>

            {/* App Info Card */}
            <View style={styles.appInfoCard}>
                 {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
                 <Text style={styles.appName}>{appName}</Text>
                 <View style={styles.versionContainer}>
                    <FontAwesomeIcon icon={faCodeBranch} size={fonts.caption} color={theme.textSecondary} style={styles.versionIcon}/>
                    <Text style={styles.appVersion}>Version {appVersion} (Build {buildNumber})</Text>
                 </View>
            </View>

            {/* Mission Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faBuilding} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>Our Mission</Text>
                </View>
                <Text style={styles.paragraph}>
                    Passionate about creating innovative and accessible solutions. Focused on building high-quality applications that enhance user experience through simplicity, performance, and continuous feedback.
                </Text>
            </View>

            {/* Team Card */}
             <View style={styles.card}>
                 <View style={styles.cardHeader}>
                    <FontAwesomeIcon icon={faUsers} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Our Team</Text>
                 </View>
                <Text style={styles.paragraph}>
                    Every member brings unique skills and dedication, allowing us to collaborate effectively and work towards making a positive impact. We believe in the power of teamwork to build great things.
                </Text>
             </View>

             {/* Links Card */}
            <View style={styles.card}>
                 <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faGlobe} size={fonts.h2} color={theme.primary} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>Connect With Us</Text>
                 </View>

                 {/* Website Link Row */}
                 {websiteUrl && (
                    <TouchableOpacity
                        style={[styles.linkRow, !contactEmail && styles.linkRowLast]}
                        onPress={() => handleOpenLink(websiteUrl, 'web')}
                        accessibilityRole="link"
                        accessibilityLabel="Visit our website"
                     >
                        <FontAwesomeIcon icon={faGlobe} size={fonts.body} color={theme.primary} style={styles.linkIcon} />
                        <Text style={styles.linkText}>Visit Our Website</Text>
                        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.textSecondary} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}

                 {/* Contact Email Link Row */}
                 {contactEmail && (
                    <TouchableOpacity
                        style={[styles.linkRow, styles.linkRowLast]}
                        onPress={() => handleOpenLink(contactEmail, 'email')}
                        accessibilityRole="link"
                        accessibilityLabel="Contact support via email"
                    >
                         <FontAwesomeIcon icon={faEnvelope} size={fonts.body} color={theme.primary} style={styles.linkIcon} />
                        <Text style={styles.linkText}>Contact Support</Text>
                         <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.textSecondary} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}

            </View>

            {/* Footer / Copyright */}
             <Text style={styles.footerText}>© {new Date().getFullYear()} {appName}. All rights reserved.</Text>

        </ScrollView>
    </SafeAreaView>
  );
};

// --- Helper Function to Create Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.primary, // Use theme primary for safe area notch/status bar
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.primary, // Use theme primary for header background
    borderBottomWidth: StyleSheet.hairlineWidth, // Add subtle border
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' // Subtle border based on theme
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    fontSize: fonts.h2,
    fontWeight: 'bold', // Keep title bold
    color: theme.white, // Keep header text white
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
    backgroundColor: theme.background, // Use theme background
    padding: 20,
    paddingBottom: 30,
  },
  appInfoCard: {
      alignItems: 'center',
      paddingVertical: 25,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
  },
  logo: {
      width: 80,
      height: 80,
      borderRadius: 15,
      marginBottom: 15,
  },
  appName: {
    fontSize: fonts.h1,
    fontWeight: 'bold',
    color: theme.text,
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
    fontSize: fonts.caption,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitle: {
    fontSize: fonts.h2,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  paragraph: {
    fontSize: fonts.body,
    color: theme.textSecondary,
    lineHeight: fonts.body * 1.5,
    textAlign: 'left',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  linkRowLast: {
     borderBottomWidth: 0,
  },
  linkIcon: {
    marginRight: 15,
    width: 20,
    textAlign: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: fonts.label,
    color: theme.primary, // Keep links primary color
    fontWeight: '500',
  },
  linkChevron: {
    marginLeft: 10,
    color: theme.textSecondary,
  },
  footerText: {
      marginTop: 20,
      paddingBottom: 10,
      fontSize: fonts.caption,
      color: theme.textSecondary,
      textAlign: 'center',
      opacity: 0.8,
  },
});

export default AboutScreen;