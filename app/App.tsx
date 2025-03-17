import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import AppNavigator from './Navigation/AppNavigator'; // Import your AppNavigator component

export default function App() {
  useEffect(() => {
    Orientation.lockToLandscape(); 
    return () => Orientation.unlockAllOrientations(); 
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppNavigator /> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
});
