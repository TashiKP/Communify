import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const [isEnglish, setIsEnglish] = useState(true); // true for English, false for Dzongkha
  
  const toggleLanguage = () => {
    setIsEnglish(previous => !previous);
  };
  
  return (
    <View style={styles.navbar}>
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <View style={[
          styles.toggleSlider,
          isEnglish ? styles.toggleSliderLeft : styles.toggleSliderRight
        ]}>
          <Text style={styles.toggleActiveText}>
            {isEnglish ? 'Eng' : 'Dzo'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <Text style={styles.navbarTitle}>Communify</Text>
      
      <TouchableOpacity>
        <FontAwesomeIcon
          icon={faUserCircle}
          size={35}
          color="white"
          style={styles.profileIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0077b6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  
  toggleButton: {
    width: 70,  // Reduced width to make it thinner
    height: 30,  // Reduced height for a thinner look
    borderRadius: 14,
    backgroundColor: 'rgb(255, 255, 255)',
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleSlider: {
    width: 35, // Adjusted to fit the new toggle button width
    height: 25,  // Adjusted to fit the new toggle button height
    borderRadius: 10,
    backgroundColor: '#0077b6',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleSliderLeft: {
    left: 4,
  },
  toggleSliderRight: {
    right: 4,
  },
  toggleActiveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navbarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: -25, // Slightly move title to the left
    textShadowColor: '#000', // Adding shadow to the text
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileIcon: {
    shadowColor: '#000', // Shadow effect for the profile icon
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default Navbar;
