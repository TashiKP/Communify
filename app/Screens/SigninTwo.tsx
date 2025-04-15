import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';

const primaryColor = '#0077b6';
const backgroundColor = '#f0f9ff';
const textColor = '#000';

const { width } = Dimensions.get('window');

const SigninTwo = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleGetStarted = () => {
    console.log('Selected Option:', selectedOption);
    // Implement navigation or further actions based on the selected option
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Account setup</Text>
            <Text style={styles.subtitle}>Choose the option that best characterizes the communicator. This can be modified in the settings at any time.</Text>

            <TouchableOpacity style={styles.optionContainer} onPress={() => setSelectedOption('Level 1 ASD')}>
              <View style={styles.radio}>
                {selectedOption === 'Level 1 ASD' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Level 1 ASD (Requires support)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionContainer} onPress={() => setSelectedOption('Level 2 ASD')}>
              <View style={styles.radio}>
                {selectedOption === 'Level 2 ASD' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Level 2 ASD (Requires substantial support)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionContainer} onPress={() => setSelectedOption('Level 3 ASD')}>
              <View style={styles.radio}>
                {selectedOption === 'Level 3 ASD' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Level 3 ASD (Requires high substantial support)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionContainer} onPress={() => setSelectedOption('Not ASD')}>
              <View style={styles.radio}>
                {selectedOption === 'Not ASD' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Select this option if you are not an individual with ASD.</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.getStartedButton, !selectedOption && styles.disabledButton]}
                onPress={handleGetStarted}
                disabled={!selectedOption}
              >
                <Text style={styles.getStartedButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryColor,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  formContainer: {
    backgroundColor: backgroundColor,
    width: width * 0.80,
    padding: 12,
    borderRadius: 16,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20, // Matching SignupScreen's title size
    fontWeight: '700',
    marginBottom: 10,
    color: primaryColor,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: textColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radio: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  radioInner: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: primaryColor,
  },
  optionText: {
    fontSize: 16,
    color: textColor,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: primaryColor,
    padding: 10, // Matching SignupScreen's button padding
    borderRadius: 8, // Matching SignupScreen's button border radius
    alignItems: 'center',
    marginTop: 8, // Matching SignupScreen's button margin top
    width: '50%', // Matching SignupScreen's button width
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16, // Matching SignupScreen's button text size
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default SigninTwo;