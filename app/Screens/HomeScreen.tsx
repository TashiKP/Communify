import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import NavBarComponent from '../components/Symbols';  
import BottomBar from '../components/bottomnav';
import CustomPageComponent from '../components/CustomPageComponent';  

const HomeScreen = () => {
  const [isCustomPage, setIsCustomPage] = useState(false);  

  const handlePlusPress = () => {
    setIsCustomPage(true);  
  };

  const handleBackPress = () => {
    setIsCustomPage(false);  
  };

  const handleHomePress = () => {
    setIsCustomPage(false);  
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <IconInputComponent />
      {isCustomPage ? (
        <CustomPageComponent onBackPress={handleBackPress} />  
      ) : (
        <NavBarComponent />  
      )}
      <BottomBar handlePlusPress={handlePlusPress} handleHomePress={handleHomePress} /> 
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
