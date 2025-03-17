import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import BackspaceIcon from '../../Assets/backspace-svgrepo-com.svg';
 // Importing the local SVG as a component

const IconInputComponent = () => {
  return (
    <View style={styles.container}>
      <View style={styles.blueSection}>
        <TouchableOpacity style={styles.iconButton}>
          <BackspaceIcon width={30} height={30} />
        </TouchableOpacity>
      </View>

      <View style={styles.whiteSection} />

      <View style={styles.blueSection}>
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <BackspaceIcon width={30} height={30} />
            <Text style={styles.xIcon}></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <BackspaceIcon width={30} height={30} />
          </TouchableOpacity>
        </View>
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
    width: 125,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  xIcon: {
    position: 'absolute',
    fontSize: 14,
    color: 'black',
    top: 5,
    right: 5,
  },
  rightButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
});

export default IconInputComponent;
