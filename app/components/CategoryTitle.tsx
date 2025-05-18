import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useAppearance} from '../context/AppearanceContext';

interface CategoryTitleProps {
  text: string;
}

const CategoryTitle: React.FC<CategoryTitleProps> = ({text}) => {
  const {theme} = useAppearance();

  const styles = React.useMemo(() => {
    const categoryTitleFontSize = 18;
    return StyleSheet.create({
      categoryTitleContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.primary || '#007bff',
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
      categoryTitleText: {
        fontSize: categoryTitleFontSize,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.5,
      },
    });
  }, [theme]);

  return (
    <View style={styles.categoryTitleContainer}>
      <Text
        style={styles.categoryTitleText}
        numberOfLines={1}
        ellipsizeMode="tail">
        {text}
      </Text>
    </View>
  );
};

export default CategoryTitle;
