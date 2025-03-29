import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faMusic, faTachometerAlt, faVolumeUp, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';

interface SymbolVoiceOverProps {
  visible: boolean;
  onClose: () => void;
}

const SymbolVoiceOver: React.FC<SymbolVoiceOverProps> = ({ visible, onClose }) => {
  const [pitch, setPitch] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [volume, setVolume] = useState(70);
  const [pitchLocked, setPitchLocked] = useState(false);
  const [speedLocked, setSpeedLocked] = useState(false);
  const [volumeLocked, setVolumeLocked] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.title}>Symbol Voice Over</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Content area */}
          <View style={styles.contentContainer}>
            {/* Pitch Control */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faMusic} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Pitch</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={pitch}
                  onValueChange={setPitch}
                  disabled={pitchLocked}
                  minimumTrackTintColor="#023e8a"
                  maximumTrackTintColor="#90e0ef"
                  thumbTintColor="#0077b6"
                />
                <TouchableOpacity 
                  style={[styles.lockButton, pitchLocked ? styles.locked : {}]}
                  onPress={() => setPitchLocked(!pitchLocked)}
                >
                  <FontAwesomeIcon 
                    icon={pitchLocked ? faLock : faLockOpen} 
                    size={22} 
                    color={pitchLocked ? "#023e8a" : "#90e0ef"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Speed Control */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faTachometerAlt} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Speed</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={speed}
                  onValueChange={setSpeed}
                  disabled={speedLocked}
                  minimumTrackTintColor="#023e8a"
                  maximumTrackTintColor="#90e0ef"
                  thumbTintColor="#0077b6"
                />
                <TouchableOpacity 
                  style={[styles.lockButton, speedLocked ? styles.locked : {}]}
                  onPress={() => setSpeedLocked(!speedLocked)}
                >
                  <FontAwesomeIcon 
                    icon={speedLocked ? faLock : faLockOpen} 
                    size={22} 
                    color={speedLocked ? "#023e8a" : "#90e0ef"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Volume Control */}
            <View style={styles.card}>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <FontAwesomeIcon icon={faVolumeUp} size={22} color="#0077b6" />
                </View>
                <Text style={styles.optionLabel}>Volume</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={volume}
                  onValueChange={setVolume}
                  disabled={volumeLocked}
                  minimumTrackTintColor="#023e8a"
                  maximumTrackTintColor="#90e0ef"
                  thumbTintColor="#0077b6"
                />
                <TouchableOpacity 
                  style={[styles.lockButton, volumeLocked ? styles.locked : {}]}
                  onPress={() => setVolumeLocked(!volumeLocked)}
                >
                  <FontAwesomeIcon 
                    icon={volumeLocked ? faLock : faLockOpen} 
                    size={22} 
                    color={volumeLocked ? "#023e8a" : "#90e0ef"} 
                  />
                </TouchableOpacity>
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
  lockButton: {
    width: 40,
    alignItems: 'center',
    padding: 8,
  },
  locked: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 5,
  },
  valueText: {
    color: '#0077b6',
    fontWeight: 'bold',
  },
});

export default SymbolVoiceOver;