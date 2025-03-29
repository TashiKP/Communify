import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface SearchBarProps {
  searchAnim: Animated.Value;
  overlayAnim: Animated.Value;
  closeSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchAnim, overlayAnim, closeSearch }) => {
  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={closeSearch}>
      {/* Touchable overlay to close search bar */}
      <TouchableOpacity 
        style={[styles.overlay, { opacity: overlayAnim }]} 
        activeOpacity={1} 
        onPress={closeSearch} 
      />

      {/* Animated Search Bar */}
      <Animated.View style={[styles.searchContainer, { transform: [{ translateY: searchAnim }] }]}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search..." 
          placeholderTextColor="#888"
        />
        <View style={styles.divider} />
        <TouchableOpacity onPress={closeSearch}>
          <FontAwesomeIcon icon={faCheck} size={24} color="green" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchContainer: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    elevation: 5, // Shadow effect
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 10,
    color: '#333',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
});

export default SearchBar;
