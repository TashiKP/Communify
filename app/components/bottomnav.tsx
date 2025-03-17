import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icons

const BottomBar = () => {
  return (
    <View style={styles.bottomBar}>
      {/* Icon 1 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="home" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 2 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="search" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 3 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="heart" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 4 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="user" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 5 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="cog" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 6 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="bell" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Icon 7 */}
      <TouchableOpacity style={styles.button}>
        <Icon name="info-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Even space between icons
    alignItems: 'center',
    backgroundColor: '#0077b6',
    height: 50, // Thin height
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5, // Optional: adjust if needed
  },
  button: {
    padding: 5,
  },
  divider: {
    width: 1,
    height: '70%', // Adjust the height of the divider to suit your needs
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Light divider
  },
});

export default BottomBar;
