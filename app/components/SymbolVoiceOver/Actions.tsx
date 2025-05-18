import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faUndo} from '@fortawesome/free-solid-svg-icons';
import {ThemeColors} from './types';

interface ActionsProps {
  onReset: () => void;
  isResetDisabled: boolean;
  styles: any;
  theme: ThemeColors;
  t: (key: string) => string;
}

const Actions: React.FC<ActionsProps> = ({
  onReset,
  isResetDisabled,
  styles,
  theme,
  t,
}) => {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
        onPress={onReset}
        disabled={isResetDisabled}
        accessibilityRole="button"
        accessibilityLabel={t('common.resetChanges')}
        accessibilityState={{disabled: isResetDisabled}}>
        <FontAwesomeIcon
          icon={faUndo}
          size={16 * 1.1}
          color={isResetDisabled ? theme.disabled : theme.textSecondary}
          style={styles.buttonIcon}
        />
        <Text
          style={[
            styles.resetButtonText,
            {color: isResetDisabled ? theme.disabled : theme.textSecondary},
            isResetDisabled && styles.textDisabled,
          ]}>
          {t('common.resetChanges')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Actions;
