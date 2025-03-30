import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faSearch, faPlus, faBoxes, faHome, 
  faKeyboard, faCog 
} from '@fortawesome/free-solid-svg-icons';
import Menu from '../components/menu';
import SearchBar from '../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// Type for props
type BottomBarProps = {
  handlePlusPress: () => void;
};

const BottomBar: React.FC<BottomBarProps> = React.memo(({ handlePlusPress }) => {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);

  // Animation values
  const [slideAnim] = useState(new Animated.Value(500)); 
  const [overlayAnim] = useState(new Animated.Value(0)); 
  const [searchAnim] = useState(new Animated.Value(100)); // Start below screen

  // Type the navigation hook with NativeStackNavigationProp
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Open Settings Menu
  const handleSettingsPress = useCallback(() => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        overshootClamping: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, overlayAnim]);

  // Close Settings Menu
  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 500,
        useNativeDriver: true,
        overshootClamping: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  }, [slideAnim, overlayAnim]);

  // Open Search Bar
  const handleSearchPress = useCallback(() => {
    setSearchVisible(true);
    Animated.parallel([
      Animated.spring(searchAnim, {
        toValue: 0, // Move to the center
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1, // Show overlay
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [searchAnim, overlayAnim]);

  // Close Search Bar
  const closeSearch = useCallback(() => {
    Animated.parallel([
      Animated.spring(searchAnim, {
        toValue: 1, // Move off-screen
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0, // Hide overlay
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSearchVisible(false));
  }, [searchAnim, overlayAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.button} onPress={handleSearchPress}>
          <FontAwesomeIcon icon={faSearch} size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={handlePlusPress}>  {/* Handle Plus press */}
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

      {/* Settings Menu */}
      <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu}>
        <Menu slideAnim={slideAnim} overlayAnim={overlayAnim} closeMenu={closeMenu} />
      </Modal>

      {/* Search Bar */}
      {isSearchVisible && (
        <SearchBar searchAnim={searchAnim} overlayAnim={overlayAnim} closeSearch={closeSearch} />
      )}
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
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default BottomBar;
