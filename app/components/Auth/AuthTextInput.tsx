import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';

import * as Colors from '../../constants/colors'; // Adjust path as needed
import * as Dimens from '../../constants/dimensions'; // Adjust path as needed

interface AuthTextInputProps extends TextInputProps {
  label: string;
  icon?: IconDefinition;
  error?: string | null; // Optional error message to display below the input
  containerStyle?: ViewStyle;
  inputWrapperStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  iconStyle?: ViewStyle; // For the icon container, not the icon itself
  inputRef?: React.RefObject<TextInput>; // To forward refs
}

const AuthTextInput: React.FC<AuthTextInputProps> = ({
  label,
  icon,
  error,
  containerStyle,
  inputWrapperStyle,
  labelStyle,
  inputStyle,
  iconStyle,
  inputRef,
  ...restOfProps
}) => {
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          inputWrapperStyle,
          error ? styles.inputWrapperError : null,
        ]}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            size={Dimens.ICON_SIZE_SMALL || 16}
            color={Colors.PLACEHOLDER_COLOR}
            style={[styles.inputIcon, iconStyle]}
          />
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.PLACEHOLDER_COLOR}
          {...restOfProps}
        />
      </View>
      {error && <Text style={styles.inlineErrorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Dimens.INPUT_GROUP_MARGIN_BOTTOM || 15,
  },
  label: {
    fontSize: Dimens.FONT_SIZE_LABEL || 14,
    fontWeight: '500',
    color: Colors.TEXT_COLOR_SECONDARY,
    marginBottom: Dimens.LABEL_MARGIN_BOTTOM || 6,
    marginLeft: 2, // Small indent for alignment
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.INPUT_BACKGROUND_COLOR || '#f0f0f0',
    borderWidth: Dimens.BORDER_WIDTH_INPUT || 1,
    borderColor: Colors.BORDER_COLOR_MEDIUM || '#ccc',
    borderRadius: Dimens.BORDER_RADIUS_INPUT || 8,
    height: Dimens.INPUT_HEIGHT || 48,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: Colors.ERROR_COLOR_BORDER || 'red',
  },
  inputIcon: {
    marginRight: Dimens.ICON_MARGIN_RIGHT || 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: Dimens.FONT_SIZE_INPUT || 16,
    color: Colors.TEXT_COLOR_PRIMARY,
    paddingVertical: 0, // Ensure text is vertically centered
  },
  inlineErrorText: {
    // For individual field errors, if desired
    fontSize: Dimens.FONT_SIZE_ERROR || 12,
    color: Colors.ERROR_COLOR_TEXT || 'red',
    marginTop: Dimens.MARGIN_XSMALL || 4,
    marginLeft: 2,
  },
});

export default AuthTextInput;
