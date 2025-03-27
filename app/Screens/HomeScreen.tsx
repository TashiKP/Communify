import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import NavBarComponent from '../components/Symbols';
import BottomBar from '../components/bottomnav';
import CustomPageComponent from '../components/CustomPageComponent'; // Update the path to match the correct file

const HomeScreen = () => {
  const [isCustomPage, setIsCustomPage] = useState(false);

  const handlePlusPress = () => {
    setIsCustomPage(true); // Switch to custom page
  };

  const handleBackPress = () => {
    setIsCustomPage(false); // Go back to the original page
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <IconInputComponent />
      {/* Conditionally render based on whether it's the custom page */}
      {isCustomPage ? (
        <CustomPageComponent onBackPress={handleBackPress} />
      ) : (
        <NavBarComponent />
      )}
      <BottomBar />
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
