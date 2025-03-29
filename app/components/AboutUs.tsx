import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface AboutUsProps {
  visible: boolean;
  onClose: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Blue Navigation Bar */}
          <View style={styles.navBar}>
            <Text style={styles.navTitle}>About Our Team</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Team Description */}
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              Our team is passionate about creating innovative solutions to improve accessibility and user experience. We are dedicated to building apps with a focus on simplicity, performance, and user feedback. Every member brings unique skills to the table, making us stronger together as we work towards making a positive impact.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    elevation: 5,
  },
  navBar: {
    backgroundColor: '#0077b6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navTitle: {
    fontSize: 22,
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
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default AboutUs;
