import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios, { CancelTokenSource, AxiosError } from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { FontSizes, ThemeColors, useAppearance } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';


interface CateComponentProps {
  keyword: string;
  iconKeywordForArasaac: string;
  languageForArasaac: string;
  isSelected?: boolean;
  onPress?: () => void;
  themeBorderColor?: string; // Added as an optional prop
}

const CateComponent: React.FC<CateComponentProps> = React.memo(
  ({ keyword, iconKeywordForArasaac, languageForArasaac, isSelected = false, onPress, themeBorderColor }) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorOccurred, setErrorOccurred] = useState<boolean>(false);

    const isMountedRef = useRef(true);
    const cancelTokenSourceRef = useRef<CancelTokenSource | null>(null);

    const styles = useMemo(
      () => createThemedStyles(theme, fonts, isSelected, currentLanguage, themeBorderColor),
      [theme, fonts, isSelected, currentLanguage, themeBorderColor]
    );

    useEffect(() => {
      isMountedRef.current = true;
      console.log(`CateComponent: Mounted/Updated for keyword "${keyword}", iconKeyword: "${iconKeywordForArasaac}"`);

      return () => {
        isMountedRef.current = false;
        console.log(`CateComponent: Unmounted for keyword "${keyword}"`);
      };
    }, [keyword, iconKeywordForArasaac]);

    useEffect(() => {
      setPictogramUrl(null);
      setErrorOccurred(false);

      const isSpecialKeyword =
        !iconKeywordForArasaac ||
        iconKeywordForArasaac.toLowerCase() === 'contextual' ||
        iconKeywordForArasaac.toLowerCase() === 'custom';

      if (isSpecialKeyword) {
        setLoading(false);
        return;
      }

      setLoading(true);
      cancelTokenSourceRef.current = axios.CancelToken.source();
      const currentToken = cancelTokenSourceRef.current;

      const fetchPictogram = async () => {
        const searchUrl = `https://api.arasaac.org/api/pictograms/${languageForArasaac}/search/${encodeURIComponent(
          iconKeywordForArasaac
        )}`;
        try {
          const response = await axios.get(searchUrl, {
            cancelToken: currentToken.token,
          });

          if (isMountedRef.current) {
            if (response.data?.[0]?._id) {
              setPictogramUrl(`https://static.arasaac.org/pictograms/${response.data[0]._id}/${response.data[0]._id}_300.png`);
            } else {
              setPictogramUrl(null);
              setErrorOccurred(true);
            }
          }
        } catch (err) {
          if (axios.isCancel(err)) {
            console.log(`CateComponent: Arasaac fetch cancelled for '${iconKeywordForArasaac}'.`);
            return;
          }
          if (isMountedRef.current) {
            console.error(`CateComponent: Arasaac fetch error for '${iconKeywordForArasaac}':`, (err as Error).message);
            setPictogramUrl(null);
            setErrorOccurred(true);
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      fetchPictogram();

      return () => {
        console.log(`CateComponent: Cleanup for fetch effect (keyword: ${iconKeywordForArasaac}). Cancelling request.`);
        currentToken.cancel('Component unmounted or dependencies changed, cancelling pictogram fetch.');
      };
    }, [iconKeywordForArasaac, languageForArasaac]);

    const handlePress = () => {
      if (onPress) onPress();
    };

    const iconColor = isSelected ? theme.primary : theme.textSecondary;
    const accessibilityLabelText = isSelected
      ? t('cateComponent.selectedAccessibilityLabel', { category: keyword })
      : t('cateComponent.accessibilityLabel', { category: keyword });

    const renderIcon = () => {
      if (loading) {
        return <ActivityIndicator size="small" color={theme.textSecondary} />;
      }
      if (pictogramUrl) {
        return <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} resizeMode="contain" />;
      }
      return <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />;
    };

    return (
      <TouchableOpacity
        style={styles.cateComponent}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabelText}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.iconContainer}>{renderIcon()}</View>
        <Text style={styles.keywordText} numberOfLines={2} ellipsizeMode="tail">
          {keyword}
        </Text>
        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={iconColor} style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  }
);

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, isSelected: boolean, currentLanguage: string, themeBorderColor?: string) => {
  const bodyTextStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);

  return StyleSheet.create({
    cateComponent: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isSelected ? theme.primaryMuted : theme.card,
      paddingVertical: 12,
      paddingHorizontal: 15,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      backgroundColor: isSelected ? theme.primaryMuted : theme.background,
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: themeBorderColor || theme.border, // Use themeBorderColor if provided, fall back to theme.border
    },
    symbolImage: {
      width: '85%',
      height: '85%',
    },
    keywordText: {
      flex: 1,
      ...bodyTextStyles,
      fontWeight: isSelected ? '600' : '500',
      color: isSelected ? theme.primary : theme.text,
      textAlign: 'left',
    },
    chevronIcon: {
      marginLeft: 10,
    },
  });
};

export default CateComponent;