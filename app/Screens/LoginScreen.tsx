import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const primaryColor = '#0077b6';
const backgroundColor = '#f0f9ff';
const textColor = '#000';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [typingText, setTypingText] = useState('');
  const slogan = "Where Voices Find Their Way";
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const communify = "Communify";

  const handleLogin = () => {
    console.log('Email:', email, 'Password:', password);
  };

  useEffect(() => {
    const startAnimations = () => {
      // Pulse animation loop
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
          useNativeDriver: true,
        })
      ).start();

      // Background animation loop
      Animated.loop(
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    // Start animations after a 10-second delay
    const delayTimeout = setTimeout(() => {
      startAnimations();
    }, 10000); // 10 seconds delay

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      setTypingText(slogan.substring(0, charIndex));
      charIndex = (charIndex + 1) % (slogan.length + 1);
    }, 250);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(delayTimeout); // Cleanup timeout
    };
  }, []); // Empty dependency array to run only once when the component mounts

  const backgroundStyle = {
    transform: [
      {
        translateX: backgroundAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -width * 2],
        }),
      },
    ],
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.outerContainer}>
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.leftContainer,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                  backgroundColor: primaryColor,
                  overflow: 'hidden'
                },
              ]}
            >
              <Animated.View style={[styles.backgroundAnimation, backgroundStyle]} />
              <Text style={styles.communifyText}>
                {communify}
              </Text>
              <Text style={styles.typingText}>
                {typingText}
              </Text>
            </Animated.View>

            <View style={styles.rightContainer}>
              <Text style={styles.title}>Welcome!</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
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

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.signUpButton}>
                <Text style={styles.signUpText}>
                  Don't have an Account? <Text style={styles.signUpLink}>Sign Up</Text>
                </Text>
              </View>
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
  outerContainer: {
    flex: 2,
    margin: 10,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  leftContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: primaryColor,
  },
  rightContainer: {
    backgroundColor: backgroundColor,
    flex: 0.5,
    padding: 15,
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderTopLeftRadius: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: primaryColor,
  },
  input: {
    height: 35,
    borderColor: primaryColor,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
    color: textColor,
  },
  loginButton: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  forgotPasswordButton: {
    marginTop: 6,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: primaryColor,
    fontSize: 12,
  },
  signUpButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  signUpText: {
    color: textColor,
    fontSize: 12,
  },
  signUpLink: {
    color: primaryColor,
    fontWeight: '600',
    fontSize: 12,
  },
  typingText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'lightblue',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  communifyText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'lightblue',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  backgroundAnimation: {
    position: 'absolute',
    width: width * 3,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    left: 0,
    top: 0,
    transform: [{ translateX: 0 }],
  },
});

export default LoginScreen;
