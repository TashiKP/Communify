import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';

import * as appColors from '../../../app/constants/colors'; // Adjust path as needed
import * as appDimensions from '../../../app/constants/dimensions'; // Adjust path as needed

interface AuthScreenHeaderProps {
  title: string;
  onBackPress: () => void;
}

const AuthScreenHeader: React.FC<AuthScreenHeaderProps> = ({
  title,
  onBackPress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backButton}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <FontAwesomeIcon
          icon={faArrowLeft}
          size={appDimensions.ICON_SIZE_MEDIUM || 20}
          color={appColors.PRIMARY_COLOR}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appDimensions.PADDING_HEADER_HORIZONTAL || 15,
    paddingVertical: appDimensions.PADDING_HEADER_VERTICAL || 10,
    backgroundColor: appColors.WHITE_COLOR,
    borderBottomWidth: appDimensions.BORDER_WIDTH_INPUT || 1,
    borderBottomColor: appColors.BORDER_COLOR_LIGHT || '#eee',
  },
  backButton: {
    padding: appDimensions.PADDING_ICON_BUTTON || 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: appDimensions.FONT_SIZE_PAGE_HEADER || 18,
    fontWeight: '600',
    color: appColors.TEXT_COLOR_PRIMARY,
    textAlign: 'center',
    marginHorizontal: appDimensions.ICON_MARGIN_RIGHT || 8,
  },
  headerSpacer: {
    // To balance the back button for centering title
    width:
      (appDimensions.ICON_SIZE_MEDIUM || 20) +
      (appDimensions.PADDING_ICON_BUTTON || 8) * 2,
  },
});

export default AuthScreenHeader;
