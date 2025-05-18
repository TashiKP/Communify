// src/components/CustomPage/CategorySection.tsx
import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faFolder,
} from '@fortawesome/free-solid-svg-icons';
import {ThemeColors, FontSizes} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {GridSection, SymbolItem} from './types';
import SymbolGridItem from './SymbolGridItem';
import {useTranslation} from 'react-i18next';

interface CategorySectionProps {
  section: GridSection;
  isExpanded: boolean;
  onToggleExpansion: (categoryId: string | null) => void;
  onEditSymbol: (symbol: SymbolItem) => void;
  onDeleteSymbol: (symbol: SymbolItem) => void;
  deletingSymbolId: string | null; // ID of the symbol currently being deleted (if any)
  itemWidth: number;
  theme: ThemeColors;
  fonts: FontSizes;
}

const createStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  language: string,
) => {
  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, language);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);
  return StyleSheet.create({
    sectionContainer: {
      marginBottom: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    folderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card, // Ensure header has consistent background with container
      borderRadius: 12, // Top border radius if not expanded, or consistent
    },
    chevronIcon: {
      marginRight: 12,
      width: fonts.caption, // Fixed width for alignment
    },
    folderIcon: {
      marginRight: 12,
    },
    folderName: {
      ...h2Styles,
      fontWeight: '700',
      flex: 1,
      letterSpacing: 0.3,
      color: theme.text,
    },
    folderCount: {
      ...bodyStyles,
      fontWeight: '500',
      marginLeft: 8,
      opacity: 0.7,
      color: theme.textSecondary,
    },
    symbolsGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 12,
      paddingHorizontal: 12, // Use consistent padding
      justifyContent: 'flex-start', // Default for grid items
    },
    emptyFolderText: {
      ...bodyStyles,
      fontWeight: '500',
      fontStyle: 'italic',
      paddingVertical: 16,
      textAlign: 'center',
      width: '100%',
      color: theme.textSecondary,
    },
  });
};

const CategorySection: React.FC<CategorySectionProps> = ({
  section,
  isExpanded,
  onToggleExpansion,
  onEditSymbol,
  onDeleteSymbol,
  deletingSymbolId,
  itemWidth,
  theme,
  fonts,
}) => {
  const {t, i18n} = useTranslation();
  const styles = useMemo(
    () => createStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language],
  );

  const sectionName =
    section.id === null
      ? t('customPage.uncategorizedCategoryLabel')
      : section.name;
  const accessibilityLabel = t('customPage.categoryAccessibilityLabel', {
    name: sectionName,
    count: section.symbols.length,
    state: isExpanded ? t('common.expanded') : t('common.collapsed'),
  });

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.folderHeader}
        onPress={() => onToggleExpansion(section.id)}
        activeOpacity={0.6}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{expanded: isExpanded}}>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronDown : faChevronRight}
          size={fonts.caption}
          color={theme.textSecondary}
          style={styles.chevronIcon}
        />
        <FontAwesomeIcon
          icon={faFolder}
          size={fonts.body * 1.2}
          color={theme.primary}
          style={styles.folderIcon}
        />
        <Text style={styles.folderName}>{sectionName}</Text>
        <Text style={styles.folderCount}>({section.symbols.length})</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.symbolsGridContainer}>
          {section.symbols.map(symbol => (
            <SymbolGridItem
              key={symbol.id}
              symbol={symbol}
              itemWidth={itemWidth}
              onEdit={onEditSymbol}
              onDelete={onDeleteSymbol}
              isDeletingThis={deletingSymbolId === symbol.id}
              isAnyDeleting={!!deletingSymbolId}
              theme={theme}
              fonts={fonts}
            />
          ))}
          {section.symbols.length === 0 && (
            <Text style={styles.emptyFolderText}>
              {t('customPage.emptyFolderText')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default CategorySection;
