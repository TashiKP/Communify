import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

// Define the type for the props
interface CustomPageComponentProps {
  onBackPress: () => void;
}

const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navBarTitle}>Your Symbols</Text>
      </View>
      {/* Optionally render back button */}
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress}>
          <Text>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  navBar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    backgroundColor: '#0077b6',
    height: 25,
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#000',
  },
  navBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff'
  },
});

export default CustomPageComponent;
