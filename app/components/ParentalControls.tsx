import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, SafeAreaView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faCheck, faClock, faUserShield, faChevronLeft, faShieldAlt, faChild } from '@fortawesome/free-solid-svg-icons';

interface ParentalControlsProps {
  visible: boolean;
  onClose: () => void;
}

const ParentalControls: React.FC<ParentalControlsProps> = ({ visible, onClose }) => {
  const [violenceChecked, setViolenceChecked] = useState(false);
  const [inappropriateChecked, setInappropriateChecked] = useState(false);
  const [screenTime, setScreenTime] = useState('');
  const [asdLevel, setAsdLevel] = useState<'high' | 'medium' | 'low' | 'noAsd' | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  
  const handleSectionChange = (section: string | null) => {
    setCurrentSection(section);
  };

  const handleBack = () => {
    handleSectionChange(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.header}>
            {currentSection && (
              <TouchableOpacity style={styles.backButtonHeader} onPress={handleBack}>
                <FontAwesomeIcon icon={faChevronLeft} size={18} color="white" />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>
              {currentSection ? 
                currentSection === 'contentRestrictions' ? 'Content Restrictions' :
                currentSection === 'screenTime' ? 'Screen Time' :
                currentSection === 'asdLevel' ? 'ASD Level' : 'Parental Controls'
              : 'Parental Controls'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Main content area */}
          {currentSection === null ? (
            <View style={styles.content}>
              {/* Content Restrictions Section */}
              <TouchableOpacity 
                style={styles.accordion} 
                onPress={() => handleSectionChange('contentRestrictions')}
                activeOpacity={0.7}
              >
                <View style={styles.accordionHeader}>
                  <FontAwesomeIcon icon={faShieldAlt} size={18} color="#0077b6" />
                  <Text style={styles.sectionTitle}>Content Restrictions</Text>
                  <FontAwesomeIcon icon={faChevronLeft} size={14} color="#0077b6" style={styles.rotateIcon} />
                </View>
              </TouchableOpacity>
              
              {/* Screen Time Section */}
              <TouchableOpacity 
                style={styles.accordion} 
                onPress={() => handleSectionChange('screenTime')}
                activeOpacity={0.7}
              >
                <View style={styles.accordionHeader}>
                  <FontAwesomeIcon icon={faClock} size={18} color="#0077b6" />
                  <Text style={styles.sectionTitle}>Screen Time</Text>
                  <FontAwesomeIcon icon={faChevronLeft} size={14} color="#0077b6" style={styles.rotateIcon} />
                </View>
              </TouchableOpacity>

              {/* ASD Level Section */}
              <TouchableOpacity 
                style={styles.accordion} 
                onPress={() => handleSectionChange('asdLevel')}
                activeOpacity={0.7}
              >
                <View style={styles.accordionHeader}>
                  <FontAwesomeIcon icon={faChild} size={18} color="#0077b6" />
                  <Text style={styles.sectionTitle}>ASD Level</Text>
                  <FontAwesomeIcon icon={faChevronLeft} size={14} color="#0077b6" style={styles.rotateIcon} />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Section Content */}
              {currentSection === 'contentRestrictions' && (
                <View style={styles.accordionContent}>
                  <View style={styles.card}>
                    <View style={styles.optionRow}>
                      <Text style={styles.optionLabel}>Violent Content</Text>
                      <TouchableOpacity
                        style={[styles.checkbox, violenceChecked ? styles.checked : {}]}
                        onPress={() => setViolenceChecked(!violenceChecked)}
                      >
                        {violenceChecked && <FontAwesomeIcon icon={faCheck} size={14} color="green" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.card}>
                    <View style={styles.optionRow}>
                      <Text style={styles.optionLabel}>Inappropriate Content</Text>
                      <TouchableOpacity
                        style={[styles.checkbox, inappropriateChecked ? styles.checked : {}]}
                        onPress={() => setInappropriateChecked(!inappropriateChecked)}
                      >
                        {inappropriateChecked && <FontAwesomeIcon icon={faCheck} size={14} color="green" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {currentSection === 'screenTime' && (
                <View style={styles.accordionContent}>
                  <View style={styles.card}>
                    <View style={styles.optionRow}>
                      <Text style={styles.optionLabel}>Daily Time Limit</Text>
                      <View style={styles.timeInputContainer}>
                        <TextInput
                          style={styles.input}
                          value={screenTime}
                          onChangeText={setScreenTime}
                          keyboardType="numeric"
                          placeholder="Hours"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {currentSection === 'asdLevel' && (
                <View style={styles.accordionContent}>
                  <View style={styles.card}>
                    <View style={styles.asdButtonContainer}>
                      {['high', 'medium', 'low', 'noAsd'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.asdButton,
                            asdLevel === level ? styles.activeAsdButton : {},
                          ]}
                          onPress={() => setAsdLevel(level as 'high' | 'medium' | 'low' | 'noAsd')}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.asdButtonText, 
                            asdLevel === level ? styles.activeAsdButtonText : {}
                          ]}>
                            {level === 'noAsd' ? 'No ASD' : level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    maxHeight: '70%',
  },
  header: {
    backgroundColor: '#0077b6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
   
  },
  closeButton: {
    backgroundColor: 'rgba(255, 77, 77, 0.8)',
    borderRadius: 8,
    padding: 6,
  },
  backButtonHeader: {
    padding: 6,
  },
  content: {
    padding: 12,
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  rotateIcon: {
    transform: [{ rotate: '180deg' }],
  },
  accordionContent: {
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#f0f9ff',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 15,
    color: '#000',
  
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#0077b6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
  },
  input: {
    height: 36,
    width: 70,
    borderWidth: 1,
    borderColor: '#0077b6',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f8fcff',
    fontSize: 15,
    textAlign: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  asdButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  asdButton: {
    width: '48%',
    marginVertical: 5,
    paddingVertical: 10,
    backgroundColor: '#f8fcff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0077b6',
    alignItems: 'center',
  },
  activeAsdButton: {
    backgroundColor: '#0077b6',
    borderColor: '#0077b6',
  },
  asdButtonText: {
    fontSize: 15,
    color: '#0077b6',
    fontWeight: 'bold',
  },
  activeAsdButtonText: {
    color: 'white',
  },
 
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ParentalControls;