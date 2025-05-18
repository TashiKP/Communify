// src/components/CustomPage/SymbolModal.tsx
import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faTimes,
  faImage,
  faCheck,
  faExclamationTriangle,
  faFolderPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';
import {Picker} from '@react-native-picker/picker';
import {ThemeColors, FontSizes} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {SymbolItem, CategoryItem} from './types';
import {useTranslation} from 'react-i18next';

export interface SymbolModalData {
  name: string;
  imageUri?: string;
  categoryId: string | null; // Ensure categoryId is string | null
}

interface SymbolModalProps {
  isVisible: boolean;
  mode: 'add' | 'edit';
  editingSymbol: SymbolItem | null;
  categories: CategoryItem[];
  onClose: () => void;
  onSave: (data: SymbolModalData, originalSymbolId?: string) => void;
  onAddNewCategory: (name: string) => CategoryItem | null; // Returns new category or null
  theme: ThemeColors;
  fonts: FontSizes;
}

const createStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  language: string,
) => {
  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, language);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '90%',
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    modalTitleText: {
      ...h2Styles,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: theme.text,
    },
    modalCloseButton: {
      position: 'absolute',
      right: 12,
      top: 12,
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.background,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: {
      padding: 20,
      paddingBottom: 32,
    },
    modalLabel: {
      ...bodyStyles,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 16,
      color: theme.text,
    },
    modalImagePicker: {
      width: '100%',
      aspectRatio: 1.5,
      backgroundColor: theme.background,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    modalPickedImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    modalImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalImagePickerText: {
      ...bodyStyles,
      fontWeight: '500',
      marginTop: 8,
      color: theme.textSecondary,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? '#4a3c00' : '#fef3c7',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.isDark ? '#a68b00' : '#fed7aa',
    },
    warningIcon: {
      marginRight: 8,
    },
    warningText: {
      ...bodyStyles,
      fontWeight: '500',
      flex: 1,
      color: theme.isDark ? '#facc15' : '#92400e',
    },
    modalInput: {
      ...bodyStyles,
      fontWeight: '500',
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      backgroundColor: theme.background, // Ensure background for input
      color: theme.text, // Ensure text color for input
      borderColor: theme.border, // Ensure border color for input
    },
    modalSaveButton: {
      borderRadius: 12,
      paddingVertical: 12,
      minHeight: 48,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalButtonText: {
      ...bodyStyles,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: theme.white,
    },
    modalRemoveImageButton: {
      borderRadius: 12,
      paddingVertical: 10,
      minHeight: 48,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalRemoveImageButtonText: {
      ...bodyStyles,
      fontWeight: '600',
      color: theme.error,
    },
    modalButtonDisabled: {
      opacity: 0.5,
    },
    buttonIcon: {
      marginRight: 8,
    },
    categorySelectionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    pickerWrapper: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderColor: theme.border,
    },
    picker: {
      height: Platform.OS === 'ios' ? undefined : 48,
      // color: theme.text, // For the picker itself if possible
    },
    pickerItem: {
      // For Picker.Item specifically
      ...bodyStyles,
      fontWeight: '500',
      color: theme.text,
    },
    addCategoryButton: {
      padding: 10,
      minHeight: 48,
      minWidth: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    addCategoryButtonActive: {
      backgroundColor: theme.primaryMuted,
    },
    addCategoryInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
      gap: 8,
    },
    addCategoryInput: {
      ...bodyStyles,
      fontWeight: '500',
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.background,
      color: theme.text,
      borderColor: theme.border,
    },
    addCategoryConfirmButton: {
      borderRadius: 12,
      padding: 10,
      minHeight: 48,
      minWidth: 48,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });
};

const SymbolModal: React.FC<SymbolModalProps> = ({
  isVisible,
  mode,
  editingSymbol,
  categories,
  onClose,
  onSave,
  onAddNewCategory,
  theme,
  fonts,
}) => {
  const {t, i18n} = useTranslation();
  const styles = useMemo(
    () => createStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language],
  );

  const [modalSymbolName, setModalSymbolName] = useState('');
  const [modalImageUri, setModalImageUri] = useState<string | undefined>(
    undefined,
  );
  const [modalSelectedCategoryId, setModalSelectedCategoryId] = useState<
    string | null | undefined
  >(null); // Default to null (Uncategorized)
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      if (mode === 'edit' && editingSymbol) {
        setModalSymbolName(editingSymbol.name);
        setModalImageUri(editingSymbol.imageUri);
        setModalSelectedCategoryId(editingSymbol.categoryId ?? null);
      } else {
        // Add mode or no symbol
        setModalSymbolName('');
        setModalImageUri(undefined);
        setModalSelectedCategoryId(null); // Default to Uncategorized
      }
      setIsSavingModal(false);
      setShowAddCategoryInput(false);
      setNewCategoryName('');
    }
  }, [isVisible, mode, editingSymbol]);

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
    };
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
        Alert.alert(
          t('common.error'),
          response.errorMessage || t('customPage.errors.imageSelectFail'),
        );
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setModalImageUri(response.assets[0].uri);
      }
    });
  };

  const handleInternalAddNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert(
        t('customPage.errors.invalidCategoryNameTitle'),
        t('customPage.errors.invalidCategoryNameMessage'),
      );
      return;
    }
    // Check for duplicates (case-insensitive) within the modal's context before calling parent
    if (
      categories.some(
        cat => cat.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      Alert.alert(
        t('customPage.errors.duplicateCategoryTitle'),
        t('customPage.errors.duplicateCategoryMessage'),
      );
      return;
    }
    Keyboard.dismiss();
    const newCategory = onAddNewCategory(trimmedName);
    if (newCategory && isMountedRef.current) {
      setModalSelectedCategoryId(newCategory.id);
      setNewCategoryName('');
      setShowAddCategoryInput(false);
      // Alert is handled by parent
    }
  };

  const handleInternalSaveSymbol = () => {
    const name = modalSymbolName.trim();
    if (!name) {
      Alert.alert(
        t('customPage.errors.validationErrorTitle'),
        t('customPage.errors.symbolNameRequired'),
      );
      return;
    }
    setIsSavingModal(true);
    Keyboard.dismiss();

    // Give UI time to update (e.g., show ActivityIndicator)
    setTimeout(() => {
      if (!isMountedRef.current) {
        setIsSavingModal(false);
        return;
      }
      const symbolData: SymbolModalData = {
        name,
        imageUri: modalImageUri,
        categoryId:
          modalSelectedCategoryId === undefined
            ? null
            : modalSelectedCategoryId,
      };
      onSave(symbolData, editingSymbol?.id);
      // onClose will be called by parent after successful save if needed
      // setIsSavingModal(false); // Parent will close modal, which resets this
    }, 100);
  };

  const currentPickerValue =
    modalSelectedCategoryId === undefined ? null : modalSelectedCategoryId;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleText}>
                  {mode === 'add'
                    ? t('customPage.modal.addTitle')
                    : t('customPage.modal.editTitle')}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.modalCloseButton}
                  activeOpacity={0.6}
                  accessibilityLabel={t(
                    'customPage.modal.closeAccessibilityLabel',
                  )}
                  accessibilityRole="button">
                  <FontAwesomeIcon
                    icon={faTimes}
                    size={fonts.body * 1.2}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled">
                <Text style={styles.modalLabel}>
                  {t('customPage.modal.imageLabel')}
                </Text>
                <TouchableOpacity
                  style={styles.modalImagePicker}
                  onPress={pickImage}
                  activeOpacity={0.6}
                  accessibilityLabel={t('customPage.modal.chooseImageButton')}
                  accessibilityRole="button">
                  {modalImageUri ? (
                    <Image
                      source={{uri: modalImageUri}}
                      style={styles.modalPickedImage}
                      accessibilityLabel=""
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <FontAwesomeIcon
                        icon={faImage}
                        size={fonts.h1 * 1.3}
                        color={theme.disabled}
                      />
                      <Text style={styles.modalImagePickerText}>
                        {t('customPage.modal.chooseImageButton')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {modalImageUri &&
                  Platform.OS !== 'web' &&
                  !modalImageUri.startsWith('file://') && (
                    <View style={styles.warningBox}>
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        size={fonts.caption}
                        color={theme.error}
                        style={styles.warningIcon}
                      />
                      <Text style={styles.warningText}>
                        {t('customPage.modal.imageWarning')}
                      </Text>
                    </View>
                  )}

                <Text style={styles.modalLabel}>
                  {t('customPage.modal.nameLabel')}
                </Text>
                <TextInput
                  placeholder={t('customPage.modal.namePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={modalSymbolName}
                  onChangeText={setModalSymbolName}
                  style={styles.modalInput}
                  autoCapitalize="words"
                  accessibilityLabel={t(
                    'customPage.modal.nameInputAccessibilityLabel',
                  )}
                />

                <Text style={styles.modalLabel}>
                  {t('customPage.modal.categoryLabel')}
                </Text>
                <View style={styles.categorySelectionContainer}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={currentPickerValue}
                      onValueChange={itemValue =>
                        setModalSelectedCategoryId(itemValue)
                      }
                      style={styles.picker}
                      itemStyle={styles.pickerItem} // Apply to each item
                      mode="dropdown"
                      enabled={!showAddCategoryInput}
                      dropdownIconColor={theme.textSecondary}>
                      <Picker.Item
                        label={t('customPage.uncategorizedCategoryLabel')}
                        value={null}
                        color={theme.text}
                      />
                      {categories.map(cat => (
                        <Picker.Item
                          key={cat.id}
                          label={cat.name}
                          value={cat.id}
                          color={theme.text}
                        />
                      ))}
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addCategoryButton,
                      showAddCategoryInput && styles.addCategoryButtonActive,
                    ]}
                    onPress={() => setShowAddCategoryInput(prev => !prev)}
                    activeOpacity={0.6}
                    accessibilityLabel={
                      showAddCategoryInput
                        ? t('customPage.modal.cancelAddCategory')
                        : t('customPage.modal.addNewCategory')
                    }
                    accessibilityRole="button">
                    <FontAwesomeIcon
                      icon={showAddCategoryInput ? faTimes : faFolderPlus}
                      size={fonts.body * 1.2}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                </View>

                {showAddCategoryInput && (
                  <View style={styles.addCategoryInputContainer}>
                    <TextInput
                      style={styles.addCategoryInput}
                      placeholder={t('customPage.modal.newCategoryPlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      maxLength={30}
                      returnKeyType="done"
                      onSubmitEditing={handleInternalAddNewCategory}
                      autoFocus={true}
                      accessibilityLabel={t(
                        'customPage.modal.newCategoryInputAccessibilityLabel',
                      )}
                    />
                    <TouchableOpacity
                      style={[
                        styles.addCategoryConfirmButton,
                        !newCategoryName.trim() && styles.modalButtonDisabled,
                        {
                          backgroundColor: newCategoryName.trim()
                            ? theme.primary
                            : theme.disabled,
                        },
                      ]}
                      onPress={handleInternalAddNewCategory}
                      disabled={!newCategoryName.trim()}
                      activeOpacity={0.6}
                      accessibilityLabel={t(
                        'customPage.modal.confirmAddCategory',
                      )}
                      accessibilityRole="button">
                      <FontAwesomeIcon
                        icon={faCheck}
                        size={fonts.body * 1.2}
                        color={theme.white}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!modalSymbolName.trim() || isSavingModal) &&
                      styles.modalButtonDisabled,
                    {
                      backgroundColor:
                        modalSymbolName.trim() && !isSavingModal
                          ? theme.primary
                          : theme.disabled,
                    },
                  ]}
                  onPress={handleInternalSaveSymbol}
                  disabled={!modalSymbolName.trim() || isSavingModal}
                  activeOpacity={0.6}
                  accessibilityLabel={
                    mode === 'add'
                      ? t('customPage.modal.addSymbolButton')
                      : t('customPage.modal.saveChangesButton')
                  }
                  accessibilityRole="button">
                  {isSavingModal ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.white}
                      style={styles.buttonIcon}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={fonts.body * 1.2}
                      color={theme.white}
                      style={styles.buttonIcon}
                    />
                  )}
                  <Text style={styles.modalButtonText}>
                    {mode === 'add'
                      ? t('customPage.modal.addSymbolButton')
                      : t('customPage.modal.saveChangesButton')}
                  </Text>
                </TouchableOpacity>

                {modalImageUri && mode === 'edit' && (
                  <TouchableOpacity
                    style={styles.modalRemoveImageButton}
                    onPress={() => setModalImageUri(undefined)}
                    disabled={isSavingModal}
                    activeOpacity={0.6}
                    accessibilityLabel={t('customPage.modal.removeImageButton')}
                    accessibilityRole="button">
                    <FontAwesomeIcon
                      icon={faTrash}
                      size={fonts.caption * 1.2}
                      color={theme.error}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.modalRemoveImageButtonText}>
                      {t('customPage.modal.removeImageButton')}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SymbolModal;
