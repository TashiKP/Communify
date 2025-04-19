import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView, // Use SafeAreaView for full screen
    Platform,
    ScrollView, // Use ScrollView in case content overflows
    Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, // Back icon
    faThLarge,   // Dense
    faTh,        // Standard
    faGripVertical, // Simple
    faCheckCircle // Checkmark for selected state
} from '@fortawesome/free-solid-svg-icons';

// Define the possible layout types
export type GridLayoutType = 'simple' | 'standard' | 'dense';

// Define component props
interface GridLayoutScreenProps {
    // visible: boolean; // No longer needed - visibility controlled by rendering/navigation
    onClose: () => void; // Function to close this screen
    initialLayout?: GridLayoutType; // Current layout setting
    onSave: (layout: GridLayoutType) => void; // Callback when a layout is selected and saved
}

// --- Component ---
const GridLayoutScreen: React.FC<GridLayoutScreenProps> = ({
    onClose,
    initialLayout = 'standard',
    onSave,
}) => {
    const [selectedLayout, setSelectedLayout] = useState<GridLayoutType>(initialLayout);

    // Reset to initial layout when component mounts (or relevant prop changes)
    useEffect(() => {
        setSelectedLayout(initialLayout);
    }, [initialLayout]);

    // Handle layout selection - save and close
    const handleLayoutSelect = (layout: GridLayoutType) => {
        setSelectedLayout(layout); // Update state visually
        onSave(layout);     // Notify parent
        onClose();        // Close the screen
    };

    // Define button options with descriptions
    const layoutOptions: {
        type: GridLayoutType;
        label: string;
        icon: any;
        description: string;
    }[] = [
            { type: 'simple', label: 'Simple', icon: faGripVertical, description: 'Fewer, larger symbols per row.' },
            { type: 'standard', label: 'Standard', icon: faTh, description: 'A balanced number of symbols.' },
            { type: 'dense', label: 'Dense', icon: faThLarge, description: 'More, smaller symbols per row.' },
        ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton} hitSlop={styles.hitSlop}>
                        <FontAwesomeIcon icon={faArrowLeft} size={18} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Grid Layout</Text>
                    {/* Spacer to balance title */}
                    <View style={styles.headerButton} />
                </View>

                {/* Content Area */}
                <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                    <Text style={styles.instructionText}>
                        Select the density for the symbol grid display.
                    </Text>

                    {/* Layout Option Cards */}
                    {layoutOptions.map((option) => {
                        const isSelected = selectedLayout === option.type;
                        return (
                            <TouchableOpacity
                                key={option.type}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardSelected // Apply selected style
                                ]}
                                onPress={() => handleLayoutSelect(option.type)}
                                activeOpacity={0.8}
                                accessibilityLabel={`Select ${option.label} grid layout. ${option.description}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <View style={styles.optionContent}>
                                    <FontAwesomeIcon
                                        icon={option.icon}
                                        size={32} // Larger icon within the card
                                        color={isSelected ? '#0077b6' : '#495057'} // Dynamic color
                                        style={styles.optionIcon}
                                    />
                                    <View style={styles.optionTextContainer}>
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                isSelected && styles.optionLabelSelected // Dynamic style
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.optionDescription,
                                                 isSelected && styles.optionDescriptionSelected // Dynamic style
                                            ]}
                                        >
                                            {option.description}
                                        </Text>
                                    </View>
                                    {/* Selected Indicator */}
                                    {isSelected && (
                                         <FontAwesomeIcon icon={faCheckCircle} size={24} color="#0077b6" style={styles.checkIcon}/>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

// --- Styles --- (Professional Full Screen Redesign)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0077b6', // Match header background color
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Light background for content area
    },
    // Header Bar Styles (Similar to CustomPageComponent)
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0077b6', // Theme color
        height: Platform.OS === 'ios' ? 55 : 50,
        paddingHorizontal: 10,
        // No top padding needed if SafeAreaView handles it
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    headerButton: {
        padding: 10,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    hitSlop: { // Reusable hitslop
        top: 10, bottom: 10, left: 10, right: 10
    },
    // ScrollView & Content Styles
    scrollContentContainer: {
        padding: 20, // Padding around the content
    },
    instructionText: {
        fontSize: 16,
        color: '#495057', // Dark grey text
        textAlign: 'center',
        marginBottom: 30, // Space below instruction
        lineHeight: 22,
    },
    // Option Card Styles
    optionCard: {
        backgroundColor: '#ffffff', // White card background
        borderRadius: 12,
        padding: 18, // Generous padding inside card
        marginBottom: 15, // Space between cards
        borderWidth: 2, // Border to indicate selection state
        borderColor: '#e9ecef', // Default light border
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    optionCardSelected: {
        borderColor: '#0077b6', // Theme blue border when selected
        backgroundColor: '#e7f5ff', // Very light blue background tint when selected
    },
    optionContent: {
        flexDirection: 'row', // Align icon, text, and checkmark horizontally
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: 18, // Space between icon and text block
    },
    optionTextContainer: {
        flex: 1, // Allow text block to take available space
    },
    optionLabel: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#343a40', // Darker text for label
        marginBottom: 4, // Space between label and description
    },
    optionLabelSelected: {
        color: '#005a8c', // Slightly darker blue for selected label
    },
    optionDescription: {
        fontSize: 14,
        color: '#6c757d', // Grey for description
        lineHeight: 19,
    },
     optionDescriptionSelected: {
        color: '#0077b6', // Theme blue for selected description
     },
    checkIcon: {
        marginLeft: 15, // Space before check icon
    },
});

export default GridLayoutScreen; // Changed export name