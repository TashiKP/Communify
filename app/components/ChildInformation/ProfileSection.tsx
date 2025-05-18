import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faChild,
  faShieldAlt,
  faClock,
  faLock,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {ChildData} from './types'; // Adjust path as per your structure

interface ProfileSectionProps {
  childData: ChildData;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({childData}) => {
  const {theme, fonts} = useAppearance();
  const {t} = useTranslation();

  const styles = StyleSheet.create({
    profileSectionGradient: {
      padding: 20,
      borderRadius: 12,
    },
    profileSubSection: {
      marginBottom: 20,
    },
    profileSubSectionTitle: {
      ...getLanguageSpecificTextStyle('label', fonts, 'en'),
      fontSize: (fonts.label || 14) * 1.1,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 10,
    },
    profileSettingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    profileSettingIcon: {
      marginRight: 10,
    },
    profileSettingTextContainer: {
      flex: 1,
    },
    profileSettingLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, 'en'),
      fontSize: (fonts.body || 16) * 0.9,
      fontWeight: '700',
      color: theme.text,
    },
    profileSettingValue: {
      ...getLanguageSpecificTextStyle('body', fonts, 'en'),
      fontSize: (fonts.body || 16) * 0.8,
      fontWeight: '500',
      color: theme.textSecondary,
    },
  });

  const formatBoolean = (value: boolean | undefined) =>
    value !== undefined ? (value ? t('common.yes') : t('common.no')) : 'N/A';
  const capitalize = (str: string | undefined) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : 'N/A';

  return (
    <LinearGradient
      colors={[theme.card, theme.background]}
      style={styles.profileSectionGradient}>
      <View style={styles.profileSubSection}>
        <Text style={styles.profileSubSectionTitle}>
          {t('childInformation.safetySettings')}
        </Text>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faChild}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.asdLevel')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {childData?.childProfile?.asd_level
                ? capitalize(childData.childProfile.asd_level)
                : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faShieldAlt}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.blockInappropriate')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {formatBoolean(childData?.childProfile?.block_inappropriate)}
            </Text>
          </View>
        </View>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faShieldAlt}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.blockViolence')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {formatBoolean(childData?.childProfile?.block_violence)}
            </Text>
          </View>
        </View>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faDatabase}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.dataSharing')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {formatBoolean(childData?.childProfile?.data_sharing_preference)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.profileSubSection}>
        <Text style={styles.profileSubSectionTitle}>
          {t('childInformation.downtimeSettings')}
        </Text>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faClock}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.downtimeEnabled')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {formatBoolean(childData?.childProfile?.downtime_enabled)}
            </Text>
          </View>
        </View>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faClock}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.downtimeStart')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {childData?.childProfile?.downtime_start ?? 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faClock}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.downtimeEnd')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {childData?.childProfile?.downtime_end ?? 'N/A'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.profileSubSection}>
        <Text style={styles.profileSubSectionTitle}>
          {t('childInformation.securitySettings')}
        </Text>
        <View style={styles.profileSettingItem}>
          <FontAwesomeIcon
            icon={faLock}
            size={fonts.body * 0.9}
            color={theme.primary}
            style={styles.profileSettingIcon}
          />
          <View style={styles.profileSettingTextContainer}>
            <Text style={styles.profileSettingLabel}>
              {t('childInformation.requirePasscode')}
            </Text>
            <Text style={styles.profileSettingValue}>
              {formatBoolean(childData?.childProfile?.require_passcode)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ProfileSection;
