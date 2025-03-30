import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import NavBarComponent from '../components/Symbols';  // Your existing NavBarComponent
import BottomBar from '../components/bottomnav';
import CustomPageComponent from '../components/CustomPageComponent';  // Custom Page

const HomeScreen = () => {
  const [isCustomPage, setIsCustomPage] = useState(false);  // State to toggle between components

  const handlePlusPress = () => {
    setIsCustomPage(true);  // Switch to CustomPage
  };

  const handleBackPress = () => {
    setIsCustomPage(false);  // Go back to the NavBarComponent
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <IconInputComponent />
      {/* Conditionally render based on isCustomPage state */}
      {isCustomPage ? (
        <CustomPageComponent onBackPress={handleBackPress} />  // Show custom page
      ) : (
        <NavBarComponent />  // Show NavBarComponent by default
      )}
      <BottomBar handlePlusPress={handlePlusPress} />  {/* Pass handlePlusPress to BottomBar */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default HomeScreen;
