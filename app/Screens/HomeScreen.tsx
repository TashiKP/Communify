import React from 'react';
import { View, StyleSheet } from 'react-native';
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import NavBarComponent from '../components/Symbols';
import BottomBar from '../components/bottomnav';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Navbar />
      <IconInputComponent />
      <NavBarComponent />
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
