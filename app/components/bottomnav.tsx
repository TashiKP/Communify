import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faSearch, faPlus, faBoxes, faHome, 
  faKeyboard, faPen, faCog 
} from '@fortawesome/free-solid-svg-icons';

const BottomBar = () => {
  return (
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

      <TouchableOpacity style={styles.button}>
        <FontAwesomeIcon icon={faPen} size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.button}>
        <FontAwesomeIcon icon={faCog} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    height: 46,
  
    borderTopColor: '#000',
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