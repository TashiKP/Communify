import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Linking, Alert, Image // Added Image for potential logo
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faUsers, faInfoCircle, faEnvelope, faGlobe,
    faBuilding, // Example: Icon for Mission/Company
    faCodeBranch, // Example: Icon for Version Info
    faChevronRight // Icon for link rows
} from '@fortawesome/free-solid-svg-icons';
// Import FontAwesome brand icons if you add social media
// import { faTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient'; // Import LinearGradient

// --- Props Interface ---
interface AboutScreenProps {
  onClose: () => void; // Function to navigate back
  appName?: string; // Optional: Pass app name if not using DeviceInfo
  contactEmail?: string; // Your support email
  websiteUrl?: string; // Your website URL
  // Add props for social links if needed
  // twitterUrl?: string;
  // githubUrl?: string;
}

// --- Component ---
const AboutScreen: React.FC<AboutScreenProps> = ({
  onClose,
  appName: appNameProp,
  contactEmail = 'support@example.com', // Default email
  websiteUrl = 'https://www.example.com', // Default website
}) => {
  // --- Get App Info ---
  const appName = appNameProp || DeviceInfo.getApplicationName(); // Use prop or DeviceInfo
  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  // --- Handlers ---
  const handleOpenLink = async (url: string | undefined, type: 'email' | 'web') => {
    if (!url) return; // Don't attempt if URL is undefined
    const finalUrl = type === 'email' ? `mailto:${url}` : url;
    try {
        const canOpen = await Linking.canOpenURL(finalUrl);
        if (canOpen) {
            await Linking.openURL(finalUrl);
        } else {
            Alert.alert('Error', `Could not open ${type === 'email' ? 'email client' : 'link'}.`);
        }
    } catch (error) {
         Alert.alert('Error', `An error occurred while trying to open the link.`);
         console.error("Linking error:", error)
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
        {/* Screen Header with Gradient */}
        <LinearGradient
            colors={[headerGradientStart, headerGradientEnd]} // Define gradient colors
            style={styles.header}
        >
          <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={hitSlop}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>About</Text>
          </View>
          <View style={styles.headerButtonPlaceholder} />
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>

            {/* App Info Card */}
            <View style={styles.appInfoCard}>
                 {/* Optional Logo */}
                 {/* <Image source={require('./path/to/your/logo.png')} style={styles.logo} /> */}
                 <Text style={styles.appName}>{appName}</Text>
                 <View style={styles.versionContainer}>
                    <FontAwesomeIcon icon={faCodeBranch} size={14} color={secondaryTextColor} style={styles.versionIcon}/>
                    <Text style={styles.appVersion}>Version {appVersion} (Build {buildNumber})</Text>
                 </View>
            </View>

            {/* Mission Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faBuilding} size={20} color={primaryColor} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>Our Mission</Text>
                </View>
                <Text style={styles.paragraph}>
                    Passionate about creating innovative and accessible solutions. Focused on building high-quality applications that enhance user experience through simplicity, performance, and continuous feedback.
                </Text>
            </View>

            {/* Team Card */}
             <View style={styles.card}>
                 <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faUsers} size={20} color={primaryColor} style={styles.cardIcon}/>
                    <Text style={styles.cardTitle}>Our Team</Text>
                 </View>
                <Text style={styles.paragraph}>
                    Every member brings unique skills and dedication, allowing us to collaborate effectively and work towards making a positive impact. We believe in the power of teamwork to build great things.
                </Text>
             </View>

             {/* Links Card */}
            <View style={styles.card}>
                 <View style={styles.cardHeader}>
                     <FontAwesomeIcon icon={faGlobe} size={20} color={primaryColor} style={styles.cardIcon}/>
                     <Text style={styles.cardTitle}>Connect With Us</Text>
                 </View>

                 {/* Website Link Row */}
                 {websiteUrl && (
                    <TouchableOpacity
                        style={[styles.linkRow, !contactEmail && styles.linkRowLast]} // Remove bottom border if it's the last item
                        onPress={() => handleOpenLink(websiteUrl, 'web')}
                        accessibilityRole="link"
                     >
                        <FontAwesomeIcon icon={faGlobe} size={18} color={primaryColor} style={styles.linkIcon} />
                        <Text style={styles.linkText}>Visit Our Website</Text>
                        <FontAwesomeIcon icon={faChevronRight} size={14} color={mediumGrey} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}

                 {/* Contact Email Link Row */}
                 {contactEmail && (
                    <TouchableOpacity
                        style={[styles.linkRow, styles.linkRowLast]} // Always last item in this example
                        onPress={() => handleOpenLink(contactEmail, 'email')}
                        accessibilityRole="link"
                    >
                         <FontAwesomeIcon icon={faEnvelope} size={18} color={primaryColor} style={styles.linkIcon} />
                        <Text style={styles.linkText}>Contact Support</Text>
                         <FontAwesomeIcon icon={faChevronRight} size={14} color={mediumGrey} style={styles.linkChevron}/>
                    </TouchableOpacity>
                 )}

                {/* Add Social Media Row(s) here if needed */}

            </View>

            {/* Footer / Copyright */}
             <Text style={styles.footerText}>© {new Date().getFullYear()} {appName}. All rights reserved.</Text>

        </ScrollView>
    </SafeAreaView>
  );
};

// --- Constants & Styles ---
const primaryColor = '#0077b6';
const primaryColorLight = '#4db1e8'; // Lighter shade for gradient
const headerGradientStart = primaryColor;
const headerGradientEnd = primaryColorLight; // Gradient end color

const screenBackgroundColor = '#f4f7f9'; // Slightly different background
const cardBackgroundColor = '#ffffff';
const whiteColor = '#ffffff';
const textColor = '#2d3436'; // Darker grey for text
const secondaryTextColor = '#636e72'; // Medium grey
const lightGrey = '#e9ecef'; // Borders / dividers
const mediumGrey = '#b2bec3'; // Chevron color
const lightBorderColor = '#e0e0e0'; // Slightly darker border for flatter look

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: headerGradientStart, // Match gradient start for status bar area
  },
  header: { // Style applied by LinearGradient component
    paddingTop: Platform.OS === 'android' ? 15 : 10, // Adjusted padding
    paddingBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    fontSize: 19, // Slightly larger title
    fontWeight: 'bold', // Bolder title
    color: whiteColor,
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
    backgroundColor: screenBackgroundColor,
    padding: 20, // Overall padding
  },
  appInfoCard: { // Specific card styling for App Info
      alignItems: 'center', // Center content in this specific card
      paddingVertical: 25,
      // Base card styles (No Shadow)
      backgroundColor: cardBackgroundColor,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1, // Add or adjust border for separation
      borderColor: lightBorderColor, // Use border color
  },
  logo: { // Style for your logo image
      width: 80,
      height: 80,
      borderRadius: 15, // Optional: rounded logo
      marginBottom: 15,
  },
  appName: {
    fontSize: 26, // Larger app name
    fontWeight: 'bold', // Bold app name
    color: textColor,
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
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'center',
  },
  card: { // Reusable card style - SIMPLIFIED (No Shadow)
    backgroundColor: cardBackgroundColor,
    borderRadius: 12,
    padding: 20, // Card internal padding
    marginBottom: 20, // Space between cards
    borderWidth: 1, // Add or adjust border for separation
    borderColor: lightBorderColor, // Use border color
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, // Space below header within card
    paddingBottom: 10, // Space below title text
    borderBottomWidth: 1, // Separator line in card header
    borderBottomColor: lightGrey,
  },
  cardIcon: {
    marginRight: 12, // Space between icon and title
  },
  cardTitle: {
    fontSize: 18, // Title size within card
    fontWeight: '600', // Semi-bold
    color: textColor,
    flex: 1, // Allow title to take space
  },
  paragraph: {
    fontSize: 15, // Slightly smaller paragraph text
    color: secondaryTextColor,
    lineHeight: 23, // Adjust line height
    textAlign: 'left', // Left align paragraphs within cards
  },
  linksContainer: {
    // No specific container style needed if rows handle it
  },
  linkRow: { // Style for each tappable link row
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // Vertical padding for tap area
    borderBottomWidth: 1, // Separator between links
    borderBottomColor: lightGrey,
  },
  linkRowLast: { // Apply this style manually to the last link row if needed
     borderBottomWidth: 0,
  },
  linkIcon: {
    marginRight: 15, // More space for icon
    width: 20, // Fixed width
    textAlign: 'center',
  },
  linkText: {
    flex: 1, // Text takes available space
    fontSize: 16,
    color: primaryColor,
    fontWeight: '500',
  },
  linkChevron: {
    marginLeft: 10, // Space before chevron
    color: mediumGrey,
  },
  footerText: {
      marginTop: 20, // More space above footer
      paddingBottom: 10, // Padding at the very bottom
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
      opacity: 0.8,
  },
});

export default AboutScreen;