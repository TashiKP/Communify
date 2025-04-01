import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faAdjust } from '@fortawesome/free-solid-svg-icons';

const positions = [0, 50, 100];

const getNearestValue = (value: number) => {
  return positions.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
};

interface BottomGridProps {
  visible: boolean;
  onClose: () => void;
}

const BottomGrid: React.FC<BottomGridProps> = ({ visible, onClose }) => {
  const [layoutValue, setLayoutValue] = useState(50);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.title}>Grid Layout</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Content area */}
          <View style={styles.contentContainer}>
            {/* Grid Layout Slider */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faAdjust} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Grid Layout</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={50}
                  value={layoutValue}
                  onValueChange={(value) => setLayoutValue(getNearestValue(value))}
                  minimumTrackTintColor="#023e8a"
                  maximumTrackTintColor="#90e0ef"
                  thumbTintColor="#0077b6"
                />
              </View>
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
    width: 120,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
});

export default BottomGrid;
