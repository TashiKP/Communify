import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const primaryColor = '#0077b6';
const backgroundColor = '#f0f9ff';
const textColor = '#000';

const { width } = Dimensions.get('window');

const SignupScreen = () => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const navigation = useNavigation(); // Initialize navigation

  const handleCreateAccount = () => {
    console.log('Full Name:', fullName, 'Age:', age, 'Gender:', gender, 'Email:', email, 'Password:', password);
    // Navigate to the SigninTwo screen
    navigation.navigate('SigninTwo' as never); // Ensure 'SigninTwo' matches your route name
  };

  const selectGender = (selectedGender: React.SetStateAction<string>) => {
    setGender(selectedGender);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create an Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            {/* Gender input field with selection modal */}
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <TextInput
                style={styles.input}
                placeholder="Gender"
                value={gender}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Gender</Text>
                  <FlatList
                    data={genderOptions}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => selectGender(item)}
                      >
                        <Text style={styles.optionText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.loginButton} onPress={handleCreateAccount}>
                <Text style={styles.loginButtonText}>Create Account</Text>
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: primaryColor,
    textAlign: 'center',
  },
  input: {
    height: 38,
    borderColor: primaryColor,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 14,
    color: textColor,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '50%',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: primaryColor,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: primaryColor,
    fontWeight: '600',
  },
});

export default SignupScreen;