import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
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
import { RootStackParamList } from '..//Navigation/types'; // Adjust import path
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faUser, faChildReaching, faCommentDots, faComments, faBrain, faKeyboard,
    faCheckCircle, faArrowLeft, faThLarge, faTh, faGripVertical,
    faUserCircle, faCamera // Added Camera icon for clarity
} from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary, ImageLibraryOptions, Asset, ImagePickerResponse } from 'react-native-image-picker';

// --- Colors --- (Using refined professional palette)
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8'; // Accent
const backgroundColor = '#f8f9fa'; // Off-white background
const whiteColor = '#ffffff';
const textColor = '#212529'; // Darker text
const placeholderColor = '#6c757d'; // Standard placeholder grey
const lightGrey = '#e9ecef'; // Input backgrounds, subtle borders
const mediumGrey = '#ced4da'; // Borders
const darkGrey = '#495057'; // Labels, secondary text
const errorColor = '#dc3545';
const selectedTint = '#e7f5ff'; // Light blue tint for selection backgrounds

// --- Types --- (Keep as is)
type CommunicationStyle = 'Emerging' | 'Context-Dependent' | 'Independent' | 'Literate';
type CommunicatorType = 'Self' | 'Child' | 'Client/Patient';
type GridLayoutType = 'simple' | 'standard' | 'dense';

// --- Component ---
const SigninTwo = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'SigninTwo'>>();
    const userEmail = route.params?.email || 'User'; // Default if email not passed

    // Initialize userName using the part before '@' or keep it simple
    const initialUserName = userEmail.includes('@') ? userEmail.split('@')[0] : userEmail;
    const [userName, setUserName] = useState(initialUserName.charAt(0).toUpperCase() + initialUserName.slice(1)); // Capitalize first letter


    const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
    const [communicatorType, setCommunicatorType] = useState<CommunicatorType | null>(null);
    const [commStyle, setCommStyle] = useState<CommunicationStyle | null>(null);
    const [gridLayout, setGridLayout] = useState<GridLayoutType>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Refs (Keep refs if needed for focus logic, though not strictly necessary here) ---
    // const nameInputRef = React.createRef<TextInput>();

    // --- Options Data --- (Keep as is, but ensure icons are consistent)
    const communicatorOptions: { type: CommunicatorType; label: string; icon: any }[] = [
        { type: 'Self', label: 'Myself', icon: faUser },
        { type: 'Child', label: 'My Child', icon: faChildReaching },
        { type: 'Client/Patient', label: 'Client/Patient', icon: faUser }, // Re-using faUser is fine
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

    // --- Handlers ---
    const pickImage = useCallback(() => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) { console.log('User cancelled image picker'); return; }
            if (response.errorCode) { console.log('ImagePicker Error: ', response.errorMessage); setError('Could not load image.'); return; }
            if (response.assets && response.assets[0]?.uri) {
                setAvatarUri(response.assets[0].uri);
                setError(null); // Clear error on success
            }
        });
    }, []);

    const validateSetup = useCallback((): boolean => {
        setError(null); // Clear previous errors
        if (!userName.trim()) { setError("Please enter the user's name."); return false; }
        if (!communicatorType) { setError("Please select who will use the app."); return false; }
        if (!commStyle) { setError("Please select the primary communication style."); return false; }
        // Grid layout has a default, so no validation needed unless required
        return true;
    }, [userName, communicatorType, commStyle]); // Dependencies

    const handleCompleteSetup = useCallback(() => {
        Keyboard.dismiss();
        if (!validateSetup()) return;

        setIsLoading(true);
        setError(null);
        const setupData = {
            name: userName.trim(),
            avatar: avatarUri, // Send URI or handle upload separately
            primaryUser: communicatorType,
            communicationStyle: commStyle,
            preferredLayout: gridLayout
        };
        console.log('Completing Setup Data:', setupData);

        // Simulate API Call/Save
        setTimeout(() => {
            setIsLoading(false);
            // Navigate to Home or main app screen
            navigation.replace('Home'); // Replace stack to prevent going back to setup
        }, 1500);
    }, [validateSetup, userName, avatarUri, communicatorType, commStyle, gridLayout, navigation]); // All dependencies

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // If setup is the first screen after login/signup, go back there
            navigation.replace('Signup'); // Or 'Login' depending on flow
        }
    }, [navigation]);

    // --- Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                 {/* Clean Header */}
                 <View style={styles.header}>
                     <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                         <FontAwesomeIcon icon={faArrowLeft} size={20} color={primaryColor} />
                     </TouchableOpacity>
                     <Text style={styles.headerTitle}>Account Setup</Text>
                     {/* Spacer to center title */}
                     <View style={styles.headerSpacer} />
                 </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.innerContainer}>

                            {/* Intro Text */}
                            <Text style={styles.introText}>
                                Personalize your experience. You can change these settings later.
                            </Text>

                            {/* Section: User Profile */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Profile</Text>

                                {/* Avatar Picker */}
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
                                            returnKeyType="done"
                                            maxLength={50}
                                        />
                                         <Text style={styles.avatarHelperText}>Tap the circle to add an avatar.</Text>
                                    </View>
                                </View>
                            </View>

                             {/* Section: Primary User Type */}
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
                                                activeOpacity={0.7} >
                                                <FontAwesomeIcon icon={opt.icon} size={18} style={styles.buttonIcon} color={isSelected ? whiteColor : primaryColor} />
                                                <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>


                            {/* Section: Communication Style */}
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
                                                activeOpacity={0.8} >
                                                <FontAwesomeIcon icon={option.icon} size={22} color={isSelected ? primaryColor : darkGrey} style={styles.optionIcon} />
                                                <View style={styles.optionTextWrapper}>
                                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                                    <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
                                                </View>
                                                {/* Custom Check Indicator */}
                                                <View style={[styles.checkIndicatorBase, isSelected && styles.checkIndicatorSelected]}>
                                                    {isSelected && <FontAwesomeIcon icon={faCheckCircle} size={20} color={whiteColor} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Section: Grid Layout Preference */}
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
                                                activeOpacity={0.7} >
                                                <FontAwesomeIcon icon={opt.icon} size={20} style={styles.buttonIcon} color={isSelected ? whiteColor : primaryColor} />
                                                <Text style={[styles.selectButtonText, styles.gridButtonText, isSelected && styles.selectButtonTextSelected]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                             </View>

                            {/* Error Display */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, (isLoading || !commStyle || !communicatorType || !userName.trim()) && styles.buttonDisabled]}
                                onPress={handleCompleteSetup}
                                disabled={isLoading || !commStyle || !communicatorType || !userName.trim()} // Disable if required fields missing
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

// --- Styles --- (Professional Refinement)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: backgroundColor,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: whiteColor, // White header background
        borderBottomWidth: 1,
        borderBottomColor: lightGrey, // Subtle separator line
    },
    backButton: {
        padding: 5, // Tap area
    },
    headerTitle: {
        flex: 1, // Takes remaining space
        fontSize: 18,
        fontWeight: '600',
        color: textColor,
        textAlign: 'center',
        marginHorizontal: 10, // Ensure space around title
    },
     headerSpacer: { // Balances the back button for centering title
        width: 30, // Approx width of back button tap area
     },
    // Scroll & Inner Container
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 50, // Space at the bottom
    },
    innerContainer: {
        paddingHorizontal: 20, // Slightly less horizontal padding
        paddingTop: 25,
    },
    introText: {
        fontSize: 16,
        color: darkGrey,
        textAlign: 'center',
        marginBottom: 35, // Space before first section
        lineHeight: 23,
    },
    // Section Styling
    formSection: {
        marginBottom: 30, // Consistent spacing between sections
    },
    sectionTitle: { // Used for the Profile section header
        fontSize: 20,
        fontWeight: 'bold',
        color: textColor,
        marginBottom: 20,
    },
    label: { // General label style for inputs/groups
        fontSize: 15,
        fontWeight: '500',
        color: darkGrey,
        marginBottom: 10,
    },
    // Avatar & Name Styles
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15, // Space below this group
    },
    avatarTouchable: {
        marginRight: 15, // Space between avatar and input
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40, // Circular
        backgroundColor: lightGrey,
        borderWidth: 2,
        borderColor: primaryColor, // Indicate it's selected/changeable
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: lightGrey,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: mediumGrey,
        position: 'relative', // For camera icon overlay
    },
    cameraIconOverlay: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        backgroundColor: primaryColor,
        borderRadius: 10,
        padding: 4,
    },
    avatarInputContainer: {
        flex: 1, // Take remaining width
    },
    input: { // Consistent input style
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: mediumGrey,
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 16,
        color: textColor,
    },
    avatarHelperText: {
        fontSize: 12,
        color: placeholderColor,
        marginTop: 5,
    },
    // Button Group Styles (Communicator/Grid)
    buttonGroup: {
        flexDirection: 'row',
        gap: 12, // Spacing between buttons
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10, // Adjust as needed
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: mediumGrey,
        backgroundColor: whiteColor,
        flex: 1, // Distribute space equally
        minHeight: 50, // Ensure consistent height
    },
    gridButton: {
        // Potentially different padding/height if needed, but keeping consistent for now
    },
    selectButtonSelected: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    buttonIcon: {
        marginRight: 8, // Space between icon and text
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: primaryColor,
        textAlign: 'center',
    },
    gridButtonText: {
        fontSize: 14, // Keep consistent or slightly smaller if needed
    },
    selectButtonTextSelected: {
        color: whiteColor,
    },
    // Communication Style Options List
    optionsList: {
        // No specific style needed for the list container itself
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: whiteColor,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: mediumGrey, // Default border
        marginBottom: 12,
        minHeight: 80, // Ensure enough height for content
    },
    optionCardSelected: {
        borderColor: primaryColor,
        backgroundColor: selectedTint, // Subtle background tint on selection
    },
    optionIcon: {
        marginRight: 15,
        width: 25, // Fixed width for alignment
        textAlign: 'center',
    },
    optionTextWrapper: {
        flex: 1, // Take available space
        marginRight: 10, // Space before check indicator
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: textColor,
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: primaryColor,
    },
    optionDescription: {
        fontSize: 13,
        color: darkGrey,
        lineHeight: 18,
    },
    optionDescriptionSelected: {
        color: primaryColor, // Darker description on selection for contrast
        // fontWeight: '500', // Optionally make slightly bolder
    },
    // Custom Check Indicator instead of Radio
    checkIndicatorBase: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: mediumGrey,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: whiteColor,
    },
    checkIndicatorSelected: {
        borderColor: primaryColor,
        backgroundColor: primaryColor, // Fill when selected
    },
    // Error & Submit Button
    errorContainer: { // Refined error display
        marginVertical: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 8,
    },
    errorText: {
        color: '#721c24',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: primaryColor,
        paddingVertical: 16,
        borderRadius: 8, // Match input radius
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        marginTop: 20, // Space above button
    },
    submitButtonText: {
        color: whiteColor,
        fontWeight: 'bold',
        fontSize: 16, // Consistent button text size
    },
    buttonDisabled: {
        backgroundColor: mediumGrey, // Clear disabled state
        opacity: 0.7,
    },
});

export default SigninTwo;