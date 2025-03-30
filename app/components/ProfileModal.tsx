import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  SafeAreaView, 
  Image, 
  TextInput,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faTimes, 
  faSignOutAlt, 
  faPen, 
  faCheck,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

const AVATAR_LIBRARY = [
  { id: 'avatar1', uri: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff' },
  { id: 'avatar2', uri: 'https://ui-avatars.com/api/?name=J+D&background=FF5733&color=fff' },
];

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile?: {
    name: string;
    email: string;
    avatar: string;
  };
  onLogout?: () => void;
  onSave?: (name: string) => void;
  navigation: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  visible, 
  onClose, 
  userProfile, 
  onLogout, 
  onSave,
  navigation 
}) => {
  const profile = userProfile || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: AVATAR_LIBRARY[0].uri,
  };

  const [name, setName] = useState(profile.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  
  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setIsEditingName(false);
      setSaving(false);
    }
  }, [visible, profile]);
  
  const handleSave = () => {
    if (name.trim() === '') return;
    
    setSaving(true);
    setTimeout(() => {
      if (onSave) onSave(name);
      setSaving(false);
      setIsEditingName(false);
    }, 800);
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (isEditingName) {
      setIsEditingName(false);
      setName(profile.name);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigation.navigate('Login');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <SafeAreaView style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>User Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesomeIcon icon={faTimes} size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.contentContainer}>
              <View style={styles.profileCard}>
                <TouchableOpacity 
                  style={styles.avatarContainer} 
                  onPress={() => setShowAvatarOptions(true)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                  <View style={styles.avatarBadge}>
                    <FontAwesomeIcon icon={faCamera} size={12} color="white" />
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <View style={styles.nameContainer}>
                    {isEditingName ? (
                      <View style={styles.nameInputContainer}>
                        <TextInput
                          style={styles.nameInput}
                          value={name}
                          onChangeText={setName}
                          placeholder="Your Name"
                          placeholderTextColor="#999"
                          maxLength={30}
                          returnKeyType="done"
                          onSubmitEditing={handleSave}
                          autoFocus={true}
                        />
                      </View>
                    ) : (
                      <View style={styles.nameDisplayContainer}>
                        <Text style={styles.nameText}>{profile.name}</Text>
                        <TouchableOpacity 
                          style={styles.editNameButton}
                          onPress={() => setIsEditingName(true)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <FontAwesomeIcon icon={faPen} size={14} color="#0077b6" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.email}>{profile.email}</Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                {isEditingName && (
                  <TouchableOpacity 
                    style={[styles.saveButton, name.trim() === '' && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isSaving || name.trim() === ''}
                    activeOpacity={0.8}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} size={16} color="white" />
                        <Text style={styles.saveText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} size={16} color="white" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {showAvatarOptions && (
            <TouchableWithoutFeedback onPress={() => setShowAvatarOptions(false)}>
              <View style={styles.avatarOptionsOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.avatarOptionsContainer}>
                    <Text style={styles.avatarOptionsTitle}>Select Avatar</Text>
                    <View style={styles.avatarGrid}>
                      {AVATAR_LIBRARY.map((avatar) => (
                        <TouchableOpacity 
                          key={avatar.id}
                          style={styles.avatarOption}
                          activeOpacity={0.7}
                        >
                          <Image source={{ uri: avatar.uri }} style={styles.avatarOptionImage} />
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={styles.avatarUploadOption} activeOpacity={0.7}>
                        <FontAwesomeIcon icon={faCamera} size={24} color="#0077b6" />
                        <Text style={styles.uploadText}>Upload</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      style={styles.closeAvatarOptions}
                      onPress={() => setShowAvatarOptions(false)}
                    >
                      <Text style={styles.closeAvatarOptionsText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const modalWidth = Math.min(width * 0.85, 360);

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: modalWidth,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    backgroundColor: '#0077b6',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 8,
    padding: 5,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0077b6',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0077b6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    marginBottom: 8,
  },
  nameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editNameButton: {
    padding: 4,
    backgroundColor: '#f0f7fa',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#0077b6',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 4,
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#0077b6',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#b3d7e5',
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#0077b6',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoutText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  avatarOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionsContainer: {
    width: modalWidth,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarOption: {
    width: (modalWidth - 60) / 3,
    height: (modalWidth - 60) / 3,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  avatarUploadOption: {
    width: (modalWidth - 60) / 3,
    height: (modalWidth - 60) / 3,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0077b6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7fa',
  },
  uploadText: {
    fontSize: 12,
    color: '#0077b6',
    marginTop: 4,
  },
  closeAvatarOptions: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  closeAvatarOptionsText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
});

export default ProfileModal;