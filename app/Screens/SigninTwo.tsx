// src/Screens/SigninTwo.tsx
import React, { useState, useCallback, useRef } from 'react'; // Added useRef
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    // Dimensions, // Not used
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
    TextInput
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faUser, faChildReaching, faCommentDots, faComments, faBrain, faKeyboard,
    faCheckCircle, faArrowLeft, faThLarge, faTh, faGripVertical,
    faUserCircle, faCamera
} from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary, ImageLibraryOptions, Asset, ImagePickerResponse } from 'react-native-image-picker';
import { AuthStackParamList } from '../navigation/AuthNavigator'; // Assuming SigninTwo is part of AuthStack
import { useAuth } from '../context/AuthContext'; // Import useAuth

// --- Colors ---
const primaryColor = '#0077b6';
// const secondaryColor = '#00b4d8'; // Not used currently
const backgroundColor = '#f8f9fa';
const whiteColor = '#ffffff';
const textColor = '#212529';
const placeholderColor = '#6c757d';
const lightGrey = '#e9ecef';
const mediumGrey = '#ced4da';
const darkGrey = '#495057';
// const errorColor = '#dc3545'; // Not used directly in styles, but good to have
const selectedTint = '#e7f5ff';

// --- Types ---
type CommunicationStyle = 'Emerging' | 'Context-Dependent' | 'Independent' | 'Literate';
type CommunicatorType = 'Self' | 'Child' | 'Client/Patient';
type GridLayoutType = 'simple' | 'standard' | 'dense';

// Navigation prop type specific to this screen within AuthStack
type SigninTwoScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SigninTwo'>;
type SigninTwoScreenRouteProp = RouteProp<AuthStackParamList, 'SigninTwo'>;


const SigninTwo: React.FC = () => { // Added React.FC
    const navigation = useNavigation<SigninTwoScreenNavigationProp>();
    const route = useRoute<SigninTwoScreenRouteProp>();
    const { signIn } = useAuth(); // Get signIn from AuthContext

    const userEmail = route.params?.email || 'User';
    const initialUserName = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;
    const [userName, setUserName] = useState(initialUserName.charAt(0).toUpperCase() + initialUserName.slice(1));

    const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
    const [communicatorType, setCommunicatorType] = useState<CommunicatorType | null>(null);
    const [commStyle, setCommStyle] = useState<CommunicationStyle | null>(null);
    const [gridLayout, setGridLayout] = useState<GridLayoutType>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const nameInputRef = useRef<TextInput>(null); // Ref for name input if needed for focus

    const communicatorOptions: { type: CommunicatorType; label: string; icon: any }[] = [
        { type: 'Self', label: 'Myself', icon: faUser },
        { type: 'Child', label: 'My Child', icon: faChildReaching },
        { type: 'Client/Patient', label: 'Client/Patient', icon: faUser },
    ];
    const commStyleOptions: { type: CommunicationStyle; label: string; description: string; icon: any }[] = [
        { type: 'Emerging', label: 'Emerging', description: 'Starting with single symbols, needs significant support.', icon: faCommentDots },
        { type: 'Context-Dependent', label: 'Context-Dependent', description: 'Uses symbol combinations in familiar situations.', icon: faComments },
        { type: 'Independent', label: 'Independent', description: 'Combines symbols creatively across settings.', icon: faBrain },
        { type: 'Literate', label: 'Literate', description: 'Primarily uses text/keyboard input.', icon: faKeyboard },
    ];
    const gridLayoutOptions: { type: GridLayoutType; label: string; icon: any }[] = [
        { type: 'simple', label: 'Simple', icon: faGripVertical },
        { type: 'standard', label: 'Standard', icon: faTh },
        { type: 'dense', label: 'Dense', icon: faThLarge },
    ];

    const pickImage = useCallback(() => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) { console.log('User cancelled image picker'); return; }
            if (response.errorCode) { console.log('ImagePicker Error: ', response.errorMessage); setError('Could not load image.'); return; }
            if (response.assets && response.assets[0]?.uri) {
                setAvatarUri(response.assets[0].uri);
                setError(null);
            }
        });
    }, []);

    const validateSetup = useCallback((): boolean => {
        setError(null);
        if (!userName.trim()) { setError("Please enter the user's name."); return false; }
        if (!communicatorType) { setError("Please select who will use the app."); return false; }
        if (!commStyle) { setError("Please select the primary communication style."); return false; }
        return true;
    }, [userName, communicatorType, commStyle]);

    const handleCompleteSetup = useCallback(async () => {
        Keyboard.dismiss();
        if (!validateSetup()) return;

        setIsLoading(true);
        setError(null);
        const setupData = {
            name: userName.trim(),
            avatar: avatarUri,
            primaryUser: communicatorType,
            communicationStyle: commStyle,
            preferredLayout: gridLayout
        };
        console.log('Completing Setup Data:', setupData);

        try {
            // Simulate API Call to finalize user setup and get a token
            await new Promise(resolve => setTimeout(resolve, 1500));
            const tokenFromSetup = `user-setup-token-${Date.now()}`; // This would come from your backend
            // const userDataFromSetup = { name: userName.trim(), email: userEmail, ...otherDetails }; // Optional

            console.log('[SigninTwo] Setup success, calling auth.signIn with token:', tokenFromSetup);
            await signIn(tokenFromSetup /*, userDataFromSetup */);
            // Navigation to Home screen (via MainAppNavigator) will now happen automatically
            // due to AuthContext state change and AppNavigationDecider.
        } catch (apiError: any) {
            console.error("[SigninTwo] Setup completion API error:", apiError);
            setError(apiError.message || 'Failed to complete setup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [validateSetup, userName, avatarUri, communicatorType, commStyle, gridLayout, signIn, userEmail]); // Added signIn, userEmail

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Signup'); // Or 'Login' if that's more appropriate
        }
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                 <View style={styles.header}>
                     <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                         <FontAwesomeIcon icon={faArrowLeft} size={20} color={primaryColor} />
                     </TouchableOpacity>
                     <Text style={styles.headerTitle}>Account Setup</Text>
                     <View style={styles.headerSpacer} />
                 </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.innerContainer}>
                            <Text style={styles.introText}>
                                Personalize your experience. You can change these settings later.
                            </Text>

                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Profile</Text>
                                <View style={styles.avatarContainer}>
                                    <TouchableOpacity style={styles.avatarTouchable} onPress={pickImage}>
                                        {avatarUri ? (
                                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <FontAwesomeIcon icon={faUserCircle} size={50} color={mediumGrey} />
                                                <View style={styles.cameraIconOverlay}>
                                                    <FontAwesomeIcon icon={faCamera} size={14} color={whiteColor} />
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.avatarInputContainer}>
                                        <Text style={styles.label}>User's Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter name"
                                            placeholderTextColor={placeholderColor}
                                            value={userName}
                                            onChangeText={setUserName}
                                            autoCapitalize="words"
                                            returnKeyType="done" // Or "next" if more fields follow closely
                                            maxLength={50}
                                            editable={!isLoading}
                                        />
                                         <Text style={styles.avatarHelperText}>Tap the circle to add an avatar.</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>This app is primarily for:</Text>
                                <View style={styles.buttonGroup}>
                                    {communicatorOptions.map(opt => {
                                        const isSelected = communicatorType === opt.type;
                                        return (
                                            <TouchableOpacity
                                                key={opt.type}
                                                style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
                                                onPress={() => setCommunicatorType(opt.type)}
                                                activeOpacity={0.7}
                                                disabled={isLoading} >
                                                <FontAwesomeIcon icon={opt.icon} size={18} style={styles.buttonIcon} color={isSelected ? whiteColor : primaryColor} />
                                                <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Primary Communication Style:</Text>
                                <View style={styles.optionsList}>
                                    {commStyleOptions.map((option) => {
                                        const isSelected = commStyle === option.type;
                                        return (
                                            <TouchableOpacity
                                                key={option.type}
                                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                                onPress={() => setCommStyle(option.type)}
                                                activeOpacity={0.8}
                                                disabled={isLoading} >
                                                <FontAwesomeIcon icon={option.icon} size={22} color={isSelected ? primaryColor : darkGrey} style={styles.optionIcon} />
                                                <View style={styles.optionTextWrapper}>
                                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                                    <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
                                                </View>
                                                <View style={[styles.checkIndicatorBase, isSelected && styles.checkIndicatorSelected]}>
                                                    {isSelected && <FontAwesomeIcon icon={faCheckCircle} size={20} color={whiteColor} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                             <View style={styles.formSection}>
                                <Text style={styles.label}>Preferred Symbol Grid Layout:</Text>
                                <View style={styles.buttonGroup}>
                                    {gridLayoutOptions.map(opt => {
                                        const isSelected = gridLayout === opt.type;
                                        return(
                                            <TouchableOpacity
                                                key={opt.type}
                                                style={[styles.selectButton, styles.gridButton, isSelected && styles.selectButtonSelected]}
                                                onPress={() => setGridLayout(opt.type)}
                                                activeOpacity={0.7}
                                                disabled={isLoading} >
                                                <FontAwesomeIcon icon={opt.icon} size={20} style={styles.buttonIcon} color={isSelected ? whiteColor : primaryColor} />
                                                <Text style={[styles.selectButtonText, styles.gridButtonText, isSelected && styles.selectButtonTextSelected]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                             </View>

                            {error && ( <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> )}

                            <TouchableOpacity
                                style={[styles.submitButton, (isLoading || !commStyle || !communicatorType || !userName.trim()) && styles.buttonDisabled]}
                                onPress={handleCompleteSetup}
                                disabled={isLoading || !commStyle || !communicatorType || !userName.trim()}
                                activeOpacity={0.75} >
                                {isLoading
                                    ? <ActivityIndicator size="small" color={whiteColor} />
                                    : <Text style={styles.submitButtonText}>Complete Setup & Start</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: backgroundColor },
    keyboardAvoidingView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: whiteColor, borderBottomWidth: 1, borderBottomColor: lightGrey },
    backButton: { padding: 5 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: textColor, textAlign: 'center', marginHorizontal: 10 },
    headerSpacer: { width: 30 },
    scrollContainer: { flexGrow: 1, paddingBottom: 50 },
    innerContainer: { paddingHorizontal: 20, paddingTop: 25 },
    introText: { fontSize: 16, color: darkGrey, textAlign: 'center', marginBottom: 35, lineHeight: 23 },
    formSection: { marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: textColor, marginBottom: 20 },
    label: { fontSize: 15, fontWeight: '500', color: darkGrey, marginBottom: 10 },
    avatarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatarTouchable: { marginRight: 15 },
    avatarImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: lightGrey, borderWidth: 2, borderColor: primaryColor },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: lightGrey, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: mediumGrey, position: 'relative' },
    cameraIconOverlay: { position: 'absolute', bottom: 3, right: 3, backgroundColor: primaryColor, borderRadius: 10, padding: 4 },
    avatarInputContainer: { flex: 1 },
    input: { backgroundColor: whiteColor, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, paddingHorizontal: 15, height: 50, fontSize: 16, color: textColor },
    avatarHelperText: { fontSize: 12, color: placeholderColor, marginTop: 5 },
    buttonGroup: { flexDirection: 'row', gap: 12 },
    selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderColor: mediumGrey, backgroundColor: whiteColor, flex: 1, minHeight: 50 },
    gridButton: {},
    selectButtonSelected: { backgroundColor: primaryColor, borderColor: primaryColor },
    buttonIcon: { marginRight: 8 },
    selectButtonText: { fontSize: 14, fontWeight: '600', color: primaryColor, textAlign: 'center' },
    gridButtonText: { fontSize: 14 },
    selectButtonTextSelected: { color: whiteColor },
    optionsList: {},
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: whiteColor, padding: 15, borderRadius: 10, borderWidth: 1.5, borderColor: mediumGrey, marginBottom: 12, minHeight: 80 },
    optionCardSelected: { borderColor: primaryColor, backgroundColor: selectedTint },
    optionIcon: { marginRight: 15, width: 25, textAlign: 'center' },
    optionTextWrapper: { flex: 1, marginRight: 10 },
    optionLabel: { fontSize: 16, fontWeight: 'bold', color: textColor, marginBottom: 4 },
    optionLabelSelected: { color: primaryColor },
    optionDescription: { fontSize: 13, color: darkGrey, lineHeight: 18 },
    optionDescriptionSelected: { color: primaryColor },
    checkIndicatorBase: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: mediumGrey, justifyContent: 'center', alignItems: 'center', backgroundColor: whiteColor },
    checkIndicatorSelected: { borderColor: primaryColor, backgroundColor: primaryColor },
    errorContainer: { marginVertical: 15, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f8d7da', borderColor: '#f5c6cb', borderWidth: 1, borderRadius: 8 },
    errorText: { color: '#721c24', fontSize: 14, fontWeight: '500', textAlign: 'center' },
    submitButton: { backgroundColor: primaryColor, paddingVertical: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: 20 },
    submitButtonText: { color: whiteColor, fontWeight: 'bold', fontSize: 16 },
    buttonDisabled: { backgroundColor: mediumGrey, opacity: 0.7 },
});

export default SigninTwo;