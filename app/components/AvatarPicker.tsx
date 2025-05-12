// src/components/AvatarPicker.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Text,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, ImagePickerResponse } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle, faCamera } from '@fortawesome/free-solid-svg-icons';
import ImageResizer from 'react-native-image-resizer';
import * as Colors from '../constants/colors'; 
import * as Dimens from '../constants/dimensions'; 

// --- Props Interface ---
interface AvatarPickerProps {
    initialUri?: string | null;
    onAvatarChange: (newUri: string | undefined) => void;
    size?: number;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    placeholderColor?: string;
    cameraIconBackgroundColor?: string;
    cameraIconColor?: string;
    loadingIndicatorColor?: string;
    maxWidth?: number;
    maxHeight?: number;
    compressQuality?: number;
    outputFormat?: 'JPEG' | 'PNG' | 'WEBP';
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
    initialUri,
    onAvatarChange,
    size = 100,
    style,
    disabled = false,
    placeholderColor = Colors.BORDER_COLOR_MEDIUM,
    cameraIconBackgroundColor = Colors.PRIMARY_COLOR,
    cameraIconColor = Colors.WHITE_COLOR,
    loadingIndicatorColor = Colors.PRIMARY_COLOR,
    maxWidth = 800,
    maxHeight = 800,
    compressQuality = 85, // Good balance of quality and size
    outputFormat = 'JPEG',
    // ------------------------------------------
}) => {
    // Internal state to manage the displayed URI (can be local file or remote URL)
    const [currentAvatarUri, setCurrentAvatarUri] = useState<string | undefined>(initialUri || undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Sync with initialUri prop changes from parent ---
    useEffect(() => {
        // Update internal state only if the incoming prop is different
        if (initialUri !== currentAvatarUri) {
             setCurrentAvatarUri(initialUri || undefined);
        }
        // Intentionally excluding currentAvatarUri to prevent loop, only react to parent changes
    }, [initialUri]);

    // --- Helper: Delete a previously saved local avatar file ---
    const deletePreviousAvatar = async (filePath: string | undefined) => {
        // Only attempt deletion if it's a local file saved by this component
        if (filePath && filePath.startsWith('file://') && filePath.includes(RNFS.DocumentDirectoryPath)) {
             // RNFS expects path without 'file://' prefix
            const pathToDelete = filePath.replace('file://', '');
            try {
                const exists = await RNFS.exists(pathToDelete);
                if (exists) {
                    await RNFS.unlink(pathToDelete);
                    console.log('[AvatarPicker] Previous avatar deleted:', pathToDelete);
                }
            } catch (unlinkError) {
                console.error('[AvatarPicker] Error deleting previous avatar:', unlinkError);
                // Non-critical, logging is sufficient
            }
        }
    };

    // --- Core Logic: Pick, Resize, and Save Image ---
    const pickAndSaveImage = useCallback(async () => {
        if (disabled || isLoading) return;

        const options: ImageLibraryOptions = {
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 1,
        };

        setIsLoading(true);
        setError(null);

        // --- Declare resizedImage variable outside the try block ---
        let resizedImage: { uri: string; path: string; name: string; size: number; width: number; height: number; } | null = null;
        // ----------------------------------------------------------

        launchImageLibrary(options, async (response: ImagePickerResponse) => {
            if (response.didCancel) {
                console.log('[AvatarPicker] User cancelled image picker');
                setIsLoading(false);
                return;
            }
            if (response.errorCode) {
                console.error('[AvatarPicker] ImagePicker Error:', response.errorMessage);
                setError(`Image Picker Error: ${response.errorMessage || 'Unknown error'}`);
                setIsLoading(false);
                return;
            }
            if (response.assets && response.assets[0]?.uri) {
                const tempUri = response.assets[0].uri;

                try {
                    console.log(`[AvatarPicker] Original image URI: ${tempUri}`);
                    console.log(`[AvatarPicker] Resizing to max ${maxWidth}x${maxHeight}, Q${compressQuality}, Fmt:${outputFormat}`);

                    // --- Step 1: Resize the image (Assign to the outer variable) ---
                    resizedImage = await ImageResizer.createResizedImage(
                        tempUri,
                        maxWidth,
                        maxHeight,
                        outputFormat,
                        compressQuality,
                        0,
                        undefined, // Save to cache
                        false,
                        { mode: 'contain' }
                    );
                    // -------------------------------------------------------------
                    console.log(`[AvatarPicker] Resized image URI: ${resizedImage.uri}`);
                    console.log(`[AvatarPicker] Resized image size: ${(resizedImage.size / 1024).toFixed(2)} KB`);

                    const sourceUriForCopy = resizedImage.uri;
                    const fileExtension = outputFormat.toLowerCase();
                    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
                    const permanentPath = `${RNFS.DocumentDirectoryPath}/${uniqueFileName}`;
                    const permanentUriForDisplay = `file://${permanentPath}`;

                    const rnfsSourcePath = sourceUriForCopy.startsWith('file://') ? sourceUriForCopy.substring(7) : sourceUriForCopy;

                    console.log(`[AvatarPicker] Copying RESIZED from ${rnfsSourcePath} to ${permanentPath}`);
                    await RNFS.copyFile(rnfsSourcePath, permanentPath);
                    console.log('[AvatarPicker] RESIZED Image copied successfully to:', permanentPath);

                    await deletePreviousAvatar(currentAvatarUri);

                    setCurrentAvatarUri(permanentUriForDisplay);
                    onAvatarChange(permanentUriForDisplay);
                    setError(null);

                } catch (processingError: any) {
                    console.error('[AvatarPicker] Error processing/resizing/copying file:', processingError);
                    let userMessage = 'Failed to process image.';
                     if (processingError.message) {
                        if (processingError.message.includes('ImageResizer')) {
                            userMessage = 'Failed to resize image.';
                        } else if (processingError.message.includes('copyFile')) {
                            userMessage = 'Failed to save image locally.';
                        } else {
                            userMessage = processingError.message;
                        }
                     }
                    setError(userMessage);
                } finally {
                    // --- Step 5: Clean up (Now resizedImage is accessible) ---
                    if (resizedImage?.uri && resizedImage.uri.includes(RNFS.CachesDirectoryPath)) {
                        const resizeCachePath = resizedImage.uri.replace('file://', '');
                        RNFS.exists(resizeCachePath).then(exists => {
                             if (exists) {
                                 RNFS.unlink(resizeCachePath)
                                     .then(() => console.log('[AvatarPicker] Deleted temp resized file:', resizeCachePath))
                                     .catch(err => console.error('[AvatarPicker] Failed to delete temp resized file:', err));
                             }
                        });
                     }
                     // --- End Step 5 ---

                    setIsLoading(false);
                }
            } else {
                console.log('[AvatarPicker] Image picker response missing assets or URI.');
                setError('Could not get image data.');
                setIsLoading(false);
            }
        });
    }, [
        disabled, isLoading, currentAvatarUri, onAvatarChange,
        maxWidth, maxHeight, compressQuality, outputFormat
    ]);

    // --- Dynamic Styles based on size prop ---
    // Memoize to avoid recreating styles on every render unless size changes
    const dynamicStyles = React.useMemo(() => StyleSheet.create({
        avatarImage: {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.BORDER_COLOR_LIGHT, // Background while loading image
        },
        avatarPlaceholder: {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.INPUT_BACKGROUND_COLOR,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1, // Use a fixed border width or Dimens.BORDER_WIDTH_INPUT
            borderColor: Colors.BORDER_COLOR_MEDIUM,
        },
        placeholderIcon: {
            // Dynamically size icon based on avatar size for better scaling
            fontSize: size * 0.6,
            color: placeholderColor,
        },
        cameraIconOverlay: {
            position: 'absolute',
            bottom: size * 0.05, // Position relative to size
            right: size * 0.05,
            backgroundColor: cameraIconBackgroundColor,
            borderRadius: size * 0.15, // Relative border radius
            padding: size * 0.06, // Relative padding
            elevation: 2, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
        },
        cameraIcon: {
            // Dynamically size icon based on avatar size
            fontSize: size * 0.15,
            color: cameraIconColor,
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent overlay
            borderRadius: size / 2, // Match avatar shape
        },
    }), [size, placeholderColor, cameraIconBackgroundColor, cameraIconColor]); // Dependencies for dynamic styles

    return (
        <View style={[styles.outerContainer, style]}>
            <TouchableOpacity
                onPress={pickAndSaveImage}
                disabled={disabled || isLoading}
                style={styles.touchable}
                activeOpacity={0.7} // Standard touch feedback
            >
                {/* Display Image or Placeholder */}
                {currentAvatarUri ? (
                    <Image
                        source={{ uri: currentAvatarUri }}
                        style={dynamicStyles.avatarImage}
                        // Optional: Add onError handler for <Image> if needed
                        // onError={(e) => console.warn("Image load error:", e.nativeEvent.error)}
                    />
                ) : (
                    <View style={dynamicStyles.avatarPlaceholder}>
                        <FontAwesomeIcon icon={faUserCircle} style={dynamicStyles.placeholderIcon} />
                    </View>
                )}

                {/* Camera Icon Overlay - visible when not loading/disabled */}
                {!isLoading && !disabled && (
                     <View style={dynamicStyles.cameraIconOverlay}>
                        <FontAwesomeIcon icon={faCamera} style={dynamicStyles.cameraIcon} />
                    </View>
                )}

                {/* Loading Overlay - visible when processing */}
                {isLoading && (
                    <View style={dynamicStyles.loadingOverlay}>
                        <ActivityIndicator size="large" color={loadingIndicatorColor} />
                    </View>
                )}
            </TouchableOpacity>

            {/* Display Error Message Below Avatar */}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// --- Static Styles ---
const styles = StyleSheet.create({
    outerContainer: {
        alignItems: 'center', // Center the touchable area horizontally
        justifyContent: 'center', // Center vertically if needed within container
    },
    touchable: {
        position: 'relative', // Crucial for absolute positioning of overlays
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Colors.ERROR_COLOR_TEXT, // Use error color from constants
        // Use a small font size from dimensions or hardcode
        fontSize: Dimens.FONT_SIZE_HELPER || 12,
        marginTop: Dimens.MARGIN_XXSMALL || 4, // Add a small space below avatar
        textAlign: 'center',
        paddingHorizontal: Dimens.MARGIN_SMALL || 8, // Prevent long errors overflowing
    },
});

export default AvatarPicker;