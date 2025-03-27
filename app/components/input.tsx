import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faVolumeUp,
  faBackspace,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

const IconInputComponent = () => {
  return (
    <View style={styles.container}>
      {/* Left Blue Section with Speaker Icon */}
      <View style={[styles.blueSection, styles.firstBlueSection]}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon
            icon={faVolumeUp}
            size={30}
            color="white"
            style={styles.iconShadow}
          />{' '}
          {/* Speaker Icon */}
        </TouchableOpacity>
      </View>

      {/* White Section */}
      <View style={styles.whiteSection} />

      {/* Right Blue Section with Backspace and Trash Icons */}
      <View style={styles.blueSection}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon
            icon={faBackspace}
            size={30}
            color="white"
            style={styles.iconShadow}
          />{' '}
          {/* Backspace Icon */}
        </TouchableOpacity>
      </View>

      {/* Divider between Backspace and Trash Icons */}
      <View style={styles.divider} />

      <View style={styles.blueSection}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon
            icon={faTrash}
            size={30}
            color="white"
            style={styles.iconShadow}
          />{' '}
          {/* Trash Bin Icon */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 65,
    width: '100%',
  },
  blueSection: {
    backgroundColor: '#0077b6',
    width: 75,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstBlueSection: {
    borderRightWidth: 0,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 1, height: 1},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'black',
  },
});

export default IconInputComponent;
