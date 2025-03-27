import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faSearch, faPlus, faBoxes, faHome, 
  faKeyboard, faCog 
} from '@fortawesome/free-solid-svg-icons';
import Menu from '../components/menu' ;

const BottomBar = React.memo(() => {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(500)); // Start from off-screen
  const [overlayAnim] = useState(new Animated.Value(0)); // Overlay opacity

  const handleSettingsPress = useCallback(() => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, // Slide in to position 0 (fully visible)
        useNativeDriver: true,
        overshootClamping: true, // Prevents overshooting and adjusts immediately
      }),
      Animated.timing(overlayAnim, {
        toValue: 1, // Show overlay
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, overlayAnim]);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 500, // Slide out to off-screen position
        useNativeDriver: true,
        overshootClamping: true, // Prevents overshooting
      }),
      Animated.timing(overlayAnim, {
        toValue: 0, // Hide overlay
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  }, [slideAnim, overlayAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.button}>
          <FontAwesomeIcon icon={faSearch} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button}>
          <FontAwesomeIcon icon={faPlus} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button}>
          <FontAwesomeIcon icon={faBoxes} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button}>
          <FontAwesomeIcon icon={faHome} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button}>
          <FontAwesomeIcon icon={faKeyboard} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={handleSettingsPress}>
          <FontAwesomeIcon icon={faCog} size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Menu slideAnim={slideAnim} overlayAnim={overlayAnim} closeMenu={closeMenu} />
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    height: 46,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5,
  },
  button: {
    padding: 5,
  },
  divider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default BottomBar;
