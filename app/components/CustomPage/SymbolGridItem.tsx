// src/components/CustomPage/SymbolGridItem.tsx
import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faImage, faPen, faTrash} from '@fortawesome/free-solid-svg-icons';
import {ThemeColors, FontSizes} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {SymbolItem} from './types';
import {useTranslation} from 'react-i18next';

interface SymbolGridItemProps {
  symbol: SymbolItem;
  itemWidth: number;
  onEdit: (symbol: SymbolItem) => void;
  onDelete: (symbol: SymbolItem) => void;
  isDeletingThis: boolean;
  isAnyDeleting: boolean;
  theme: ThemeColors;
  fonts: FontSizes;
}

const createStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  language: string,
  itemWidth: number,
) => {
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);
  return StyleSheet.create({
    symbolItemContainer: {
      // Renamed from symbolItemContainer_InSection for clarity
      margin: 6,
    },
    symbolCard: {
      width: itemWidth,
      aspectRatio: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    symbolImageWrapper: {
      width: '100%',
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    symbolImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    symbolPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: theme.background,
      borderRadius: 8,
    },
    symbolInfo: {
      width: '100%',
      paddingHorizontal: 8,
      paddingVertical: 8,
      minHeight: 48, // Adjusted based on original
      backgroundColor: theme.card,
    },
    symbolName: {
      ...bodyStyles,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 6,
      paddingHorizontal: 4, // Added from original
      color: theme.text,
    },
    symbolActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.background, // From original
      minWidth: 40, // From original
      minHeight: 40, // From original
      alignItems: 'center', // From original
      justifyContent: 'center', // From original
    },
  });
};

const SymbolGridItem: React.FC<SymbolGridItemProps> = ({
  symbol,
  itemWidth,
  onEdit,
  onDelete,
  isDeletingThis,
  isAnyDeleting,
  theme,
  fonts,
}) => {
  const {t, i18n} = useTranslation();
  const styles = useMemo(
    () => createStyles(theme, fonts, i18n.language, itemWidth),
    [theme, fonts, i18n.language, itemWidth],
  );

  return (
    <View style={styles.symbolItemContainer}>
      <View style={[styles.symbolCard]}>
        <View style={styles.symbolImageWrapper}>
          {symbol.imageUri ? (
            <Image
              source={{uri: symbol.imageUri}}
              style={styles.symbolImage}
              resizeMode="contain"
              accessibilityLabel={symbol.name} // Use symbol name for accessibility
              onError={e =>
                console.warn(
                  `Image Load Error: ${symbol.name}`,
                  e.nativeEvent.error,
                )
              }
            />
          ) : (
            <View style={styles.symbolPlaceholder}>
              <FontAwesomeIcon
                icon={faImage}
                size={itemWidth * 0.35}
                color={theme.disabled}
              />
            </View>
          )}
        </View>
        <View style={styles.symbolInfo}>
          <Text
            style={styles.symbolName}
            numberOfLines={2}
            ellipsizeMode="tail">
            {symbol.name}
          </Text>
          <View style={styles.symbolActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(symbol)}
              disabled={isAnyDeleting}
              activeOpacity={0.6}
              accessibilityLabel={t('customPage.editSymbolAccessibilityLabel', {
                name: symbol.name,
              })}
              accessibilityRole="button">
              <FontAwesomeIcon
                icon={faPen}
                size={fonts.caption * 1.2}
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(symbol)}
              disabled={isAnyDeleting}
              activeOpacity={0.6}
              accessibilityLabel={t(
                'customPage.deleteSymbolAccessibilityLabel',
                {name: symbol.name},
              )}
              accessibilityRole="button">
              {isDeletingThis ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <FontAwesomeIcon
                  icon={faTrash}
                  size={fonts.caption * 1.2}
                  color={theme.error}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SymbolGridItem;
