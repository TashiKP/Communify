import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import axios, { CancelTokenSource, AxiosError } from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';

interface CateComponentProps {
  keyword: string;
  iconKeywordForArasaac: string;
  languageForArasaac: string;
  isSelected?: boolean;
  onPress?: () => void;
}

const CateComponent: React.FC<CateComponentProps> = React.memo(
  ({ keyword, iconKeywordForArasaac, languageForArasaac, isSelected = false, onPress }) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const styles = useMemo(
      () => createThemedStyles(theme, fonts, isSelected, currentLanguage),
      [theme, fonts, isSelected, currentLanguage]
    );

    const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
    const isMountedRef = useRef(true);
    const cancelTokenSourceRef = useRef<CancelTokenSource | null>(null);

    useEffect(() => {
      isMountedRef.current = true;
      console.log(`CateComponent: Mounted for keyword "${keyword}", iconKeyword: "${iconKeywordForArasaac}"`);
      return () => {
        isMountedRef.current = false;
        console.log(`CateComponent: Unmounted for keyword "${keyword}"`);
        if (cancelTokenSourceRef.current) {
          cancelTokenSourceRef.current.cancel('Component unmounted');
        }
      };
    }, []);

    useEffect(() => {
      if (!isMountedRef.current) return;
      setPictogramUrl(null);
      setLoading(true);
      setFetchAttempted(false);

      if (
        !iconKeywordForArasaac ||
        iconKeywordForArasaac.toLowerCase() === 'contextual' ||
        iconKeywordForArasaac.toLowerCase() === 'custom'
      ) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      let timer: NodeJS.Timeout | null = null;
      cancelTokenSourceRef.current = axios.CancelToken.source(); // Create new cancel token
      const fetchPictogram = async () => {
        if (!isMountedRef.current) return;
        setFetchAttempted(true);
        const searchUrl = `https://api.arasaac.org/api/pictograms/${languageForArasaac}/search/${encodeURIComponent(
          iconKeywordForArasaac
        )}`;
        try {
          const response = await axios.get(searchUrl, {
            cancelToken: cancelTokenSourceRef.current?.token,
          });
          if (isMountedRef.current && response.data?.[0]?._id) {
            setPictogramUrl(`https://static.arasaac.org/pictograms/${response.data[0]._id}/${response.data[0]._id}_300.png`);
          } else if (isMountedRef.current) {
            setPictogramUrl(null);
          }
        } catch (err) {
          if (axios.isCancel(err)) {
            // Ignore cancellation errors
            return;
          }
          if (isMountedRef.current) {
            console.error(`CateComponent: Arasaac fetch error for '${iconKeywordForArasaac}':`, (err as Error).message);
            setPictogramUrl(null);
          }
        } finally {
          if (isMountedRef.current) setLoading(false);
        }
      };
      timer = setTimeout(fetchPictogram, 50);
      return () => {
        if (timer) clearTimeout(timer);
        if (cancelTokenSourceRef.current) {
          cancelTokenSourceRef.current.cancel('Component unmounted');
        }
      };
    }, [iconKeywordForArasaac, languageForArasaac]);

    const handlePress = () => {
      if (onPress) onPress();
    };

    const iconColor = isSelected ? theme.primary : theme.textSecondary;

    const accessibilityLabelText = isSelected
      ? t('cateComponent.selectedAccessibilityLabel', { category: keyword })
      : t('cateComponent.accessibilityLabel', { category: keyword });

    return (
      <TouchableOpacity
        style={styles.cateComponent}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabelText}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.iconContainer}>
          {loading && fetchAttempted && <ActivityIndicator size="small" color={theme.textSecondary} />}
          {!loading && pictogramUrl && (
            <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} resizeMode="contain" />
          )}
          {!loading &&
            (!pictogramUrl ||
              (!fetchAttempted &&
                (iconKeywordForArasaac.toLowerCase() === 'contextual' ||
                  iconKeywordForArasaac.toLowerCase() === 'custom'))) && (
              <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />
            )}
          {!loading &&
            !pictogramUrl &&
            fetchAttempted &&
            iconKeywordForArasaac.toLowerCase() !== 'contextual' &&
            iconKeywordForArasaac.toLowerCase() !== 'custom' && (
              <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />
            )}
        </View>
        <Text style={styles.keywordText} numberOfLines={2} ellipsizeMode="tail">
          {keyword}
        </Text>
        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={iconColor} style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  }
);

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, isSelected: boolean, currentLanguage: string) => {
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
      borderColor: theme.border,
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