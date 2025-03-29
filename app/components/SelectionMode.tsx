import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faArrowDown, faHandPointer, faCheck } from '@fortawesome/free-solid-svg-icons';

interface SelectionModeProps {
  visible: boolean;
  onClose: () => void;
}

const SelectionMode: React.FC<SelectionModeProps> = ({ visible, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<'drag' | 'longClick' | null>(null);

  const toggleMode = (mode: 'drag' | 'longClick') => {
    // Toggle between selected and unselected
    if (selectedMode === mode) {
      setSelectedMode(null); // Unselect if already selected
    } else {
      setSelectedMode(mode); // Select the chosen mode
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.title}>Symbol Selection Mode</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Content area */}
          <View style={styles.contentContainer}>
            {/* Drag and Drop Mode */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faArrowDown} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Drag and Drop Mode</Text>
                <TouchableOpacity
                  style={[styles.checkbox, selectedMode === 'drag' ? styles.checked : {}]}
                  onPress={() => toggleMode('drag')}
                >
                  {selectedMode === 'drag' && (
                    <FontAwesomeIcon icon={faCheck} size={18} color="green" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Long Click Mode */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faHandPointer} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Long Click Mode</Text>
                <TouchableOpacity
                  style={[styles.checkbox, selectedMode === 'longClick' ? styles.checked : {}]}
                  onPress={() => toggleMode('longClick')}
                >
                  {selectedMode === 'longClick' && (
                    <FontAwesomeIcon icon={faCheck} size={18} color="green" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Helper text */}
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>
                {selectedMode === 'drag' 
                  ? 'Tap and hold symbols to drag them to their target location' 
                  : selectedMode === 'longClick' 
                    ? 'Long press symbols to select them for an action' 
                    : 'Please select a symbol selection mode'}
              </Text>
            </View>
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
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#0077b6',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
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
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#0077b6',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#f0f9ff',
  },
  helperTextContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0077b6',
  },
  helperText: {
    color: '#0077b6',
    fontSize: 14,
  },
});

export default SelectionMode;