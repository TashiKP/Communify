import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

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
      
      <TouchableOpacity style={styles.profileCircle}>
        <Image
          source={{ uri: 'https://via.placeholder.com/40' }}
          style={styles.profileImage}
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
    width: 80,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSlider: {
    width: 40,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
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
    color: '#0077b6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navbarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

export default Navbar;
