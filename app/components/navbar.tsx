import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform, Animated,
    Easing
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import ProfileModal from './ProfileModal'; // Assuming './ProfileModal' is the correct path
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Define a ParamList if you have typed navigation (replace 'any' with your actual stack params)
type RootStackParamList = {
  Login: undefined;
  // other routes...
};

const Navbar = () => {
    const [isEnglish, setIsEnglish] = useState(true);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const toggleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(toggleAnim, {
            toValue: isEnglish ? 0 : 1,
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
        }).start();
    }, [isEnglish, toggleAnim]);

    const sliderPosition = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['3%', '47%'],
    });

    const toggleLanguage = () => {
        setIsEnglish(previous => !previous);
        console.log('Language toggled to:', !isEnglish ? 'English' : 'Dzongkha');
    };

    const handleLogout = () => {
        console.log('User logged out');
        closeProfileModal(); // Close modal first
        // Add actual logout logic (clear tokens, reset state)
        navigation.navigate('Login'); // Navigate after logout logic
    };

    const openProfileModal = () => {
        setProfileModalVisible(true);
    };

    const closeProfileModal = () => {
        setProfileModalVisible(false);
    };

    const userProfileData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        avatar: '',
    };

    return (
        <>
            <View style={styles.navbar}>
                {/* Left Section (Language Toggle) */}
                <View style={styles.navSectionLeft}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleLanguage}
                        activeOpacity={0.8}
                        hitSlop={styles.hitSlop}
                        accessibilityRole="switch"
                        accessibilityLabel="Toggle language"
                        accessibilityState={{ checked: !isEnglish }}
                    >
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Eng</Text>
                        <Text style={[styles.toggleText, styles.toggleTextInactive]}>Dzo</Text>
                        <Animated.View
                            style={[
                                styles.toggleSlider,
                                { left: sliderPosition }
                            ]}
                        >
                            <Text style={styles.toggleTextActive}>
                                {isEnglish ? 'Eng' : 'Dzo'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Center Section (Title) */}
                <View style={styles.navSectionCenter}>
                    <Text style={styles.navbarTitle}>Communify</Text>
                </View>

                {/* Right Section (Profile Icon) */}
                <View style={styles.navSectionRight}>
                    <TouchableOpacity
                        onPress={openProfileModal}
                        hitSlop={styles.hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel="Open user profile"
                    >
                        <FontAwesomeIcon
                            icon={faUserCircle}
                            size={30}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Modal */}
            <ProfileModal
                visible={profileModalVisible}
                onClose={closeProfileModal}
                onLogout={handleLogout} // Navbar's handleLogout handles navigation
                userProfile={userProfileData}
                // navigation={navigation} // <--- REMOVED THIS LINE
            />
        </>
    );
};

// Styles remain the same...
const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0077b6',
        paddingTop: Platform.OS === 'ios' ? 10 : 5,
        paddingBottom: 10,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    navSectionLeft: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    navSectionCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navSectionRight: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    toggleButton: {
        width: 65,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    toggleSlider: {
        width: '50%',
        height: '88%',
        borderRadius: 12,
        marginVertical: '6%',
        backgroundColor: '#ffffff',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    toggleText: {
         fontSize: 13,
         fontWeight: 'bold',
         paddingHorizontal: 5,
    },
    toggleTextInactive: {
         color: 'rgba(255, 255, 255, 0.7)',
    },
    toggleTextActive: {
        color: '#0077b6',
        fontSize: 13,
        fontWeight: 'bold',
    },
    navbarTitle: {
        fontSize: 22,
        color: '#fff',
        fontWeight: 'bold',
    },
    hitSlop: {
        top: 10, bottom: 10, left: 10, right: 10
    }
});


export default Navbar;
