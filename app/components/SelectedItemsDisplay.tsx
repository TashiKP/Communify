import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { SelectedSymbol } from '../screens/HomeScreen';


interface SelectedItemsDisplayProps {
  items: SelectedSymbol[];
}

const SelectedItemsDisplay: React.FC<SelectedItemsDisplayProps> = ({ items }) => {
  const { theme, fonts } = useAppearance();

  if (!items || items.length === 0) {
    return null;
  }

  const styles = React.useMemo(() => StyleSheet.create({
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap', // Allow chips to wrap if many are selected
      alignItems: 'center',
    },
    inputItemChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card || '#ffffff',
      borderRadius: 20,
      paddingVertical: Platform.OS === 'ios' ? 8 : 6,
      paddingHorizontal: 12,
      margin: 4,
      borderWidth: 1,
      borderColor: theme.border || '#d0d7de',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 3,
    },
    chipImage: {
      width: 20,
      height: 20,
      marginRight: 8,
      resizeMode: 'contain',
      borderRadius: 4,
    },
    inputItemText: {
      color: theme.text || '#1a3c34',
      fontSize: fonts.body || 16,
      fontWeight: '600',
      maxWidth: 120, // Max width for a single chip's text
    },
  }), [theme, fonts]);

  return (
    <View style={styles.chipContainer}>
      {items.map(item => (
        <View key={item.id} style={styles.inputItemChip}>
          {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.chipImage} />}
          <Text style={styles.inputItemText} numberOfLines={1} ellipsizeMode="tail">{item.keyword}</Text>
        </View>
      ))}
    </View>
  );
};

export default SelectedItemsDisplay;