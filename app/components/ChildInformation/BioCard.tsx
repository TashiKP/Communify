import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEdit, faSave} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {ChildData} from './types'; // Import the shared type

interface BioCardProps {
  childData: ChildData;
  onSave?: (data: ChildData) => void;
}

const BioCard: React.FC<BioCardProps> = ({childData, onSave}) => {
  const {theme, fonts} = useAppearance();
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(childData);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const styles = StyleSheet.create({
    bioCard: {
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      shadowColor: theme.border,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
      overflow: 'hidden',
      marginHorizontal: 15,
      marginBottom: 15,
      width: '90%',
      alignSelf: 'center',
    },
    bioGradient: {
      borderRadius: 50,
      padding: 4,
      marginBottom: 20,
      marginTop: 20,
      shadowColor: theme.border,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.white,
      shadowColor: theme.border,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.4,
      shadowRadius: 3,
    },
    avatarText: {
      fontSize: fonts.h2 * 2 || 40,
      fontWeight: '800',
      color: theme.white,
      textShadowColor: theme.black,
      textShadowOffset: {width: 1, height: 1},
      textShadowRadius: 2,
    },
    label: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage),
      fontSize: (fonts.label || 14) * 1.1,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 5,
      alignSelf: 'flex-start',
      width: '100%',
    },
    input: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      backgroundColor: theme.card,
      width: '100%',
    },
    actionButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: theme.primary,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
      width: '100%',
    },
    actionButtonText: {
      color: theme.white,
      fontSize: fonts.body * 0.95 || 15,
      fontWeight: '600',
    },
    editIconButton: {
      padding: 8,
      backgroundColor: theme.primary,
      borderRadius: 8,
      marginTop: 20,
    },
  });

  const handleSave = () => {
    if (!editedData.user.name.trim()) {
      Alert.alert(t('common.error'), t('childInformation.errors.nameEmpty'));
      return;
    }
    if (onSave) {
      onSave({
        ...childData,
        user: editedData.user,
      });
    }
    setIsEditing(false);
    Alert.alert(t('common.success'), t('childInformation.saved'));
  };

  const initial = editedData?.user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <Animated.View
      style={[
        styles.bioCard,
        {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
      ]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.bioGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </LinearGradient>
      {isEditing ? (
        <>
          <Text style={styles.label}>{t('childInformation.name')}</Text>
          <TextInput
            style={styles.input}
            value={editedData.user.name}
            onChangeText={text =>
              setEditedData({
                ...editedData,
                user: {...editedData.user, name: text},
              })
            }
            placeholder={t('childInformation.namePlaceholder')}
            autoCapitalize="words"
          />
          <Text style={styles.label}>{t('childInformation.age')}</Text>
          <TextInput
            style={styles.input}
            value={editedData.user.age.toString()}
            onChangeText={text =>
              setEditedData({
                ...editedData,
                user: {...editedData.user, age: parseInt(text) || 0},
              })
            }
            placeholder={t('childInformation.age')}
            keyboardType="numeric"
          />
          <Text style={styles.label}>{t('childInformation.gender')}</Text>
          <TextInput
            style={styles.input}
            value={editedData.user.gender}
            onChangeText={text =>
              setEditedData({
                ...editedData,
                user: {...editedData.user, gender: text},
              })
            }
            placeholder={t('childInformation.gender')}
          />
          <Text style={styles.label}>{t('childInformation.email')}</Text>
          <TextInput
            style={styles.input}
            value={editedData.user.email}
            onChangeText={text =>
              setEditedData({
                ...editedData,
                user: {...editedData.user, email: text},
              })
            }
            placeholder={t('childInformation.email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Text style={styles.actionButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.editIconButton}
          onPress={() => setIsEditing(true)}>
          <FontAwesomeIcon
            icon={faEdit}
            size={fonts.body * 1.1}
            color={theme.white}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default BioCard;
