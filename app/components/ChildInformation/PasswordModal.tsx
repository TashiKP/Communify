import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';

interface PasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const {theme, fonts} = useAppearance();
  const {t} = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      ...getLanguageSpecificTextStyle('h2', fonts, 'en'),
      fontSize: fonts.h2 || 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      backgroundColor: theme.background,
    },
    passwordInput: {
      ...getLanguageSpecificTextStyle('body', fonts, 'en'),
      fontSize: fonts.body || 16,
      padding: 10,
      flex: 1,
      color: theme.text,
    },
    eyeIcon: {
      padding: 10,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    modalButtonText: {
      ...getLanguageSpecificTextStyle('body', fonts, 'en'),
      fontSize: fonts.body || 16,
      color: theme.white,
      fontWeight: '600',
    },
  });

  const handleSave = () => {
    onSave(newPassword);
    setNewPassword('');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {t('childInformation.updatePassword')}
          </Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('childInformation.enterNewPassword')}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              accessibilityLabel={
                isPasswordVisible
                  ? t('childInformation.hidePassword')
                  : t('childInformation.showPassword')
              }>
              <FontAwesomeIcon
                icon={isPasswordVisible ? faEyeSlash : faEye}
                size={fonts.body * 0.9}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: theme.secondary}]}
              onPress={handleSave}>
              <Text style={styles.modalButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: theme.disabled}]}
              onPress={() => {
                setNewPassword('');
                onClose();
              }}>
              <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PasswordModal;
