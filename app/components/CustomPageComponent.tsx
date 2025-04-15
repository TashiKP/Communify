import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  Asset,
  ImagePickerResponse,
} from 'react-native-image-picker';

interface CustomPageComponentProps {
  onBackPress: () => void;
}

interface SymbolItem {
  id: string;
  name: string;
  imageUri?: string;
}

const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress }) => {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [symbolName, setSymbolName] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets.length > 0) {
        const asset: Asset = response.assets[0];
        if (asset.uri) {
          setImageUri(asset.uri);
        }
      }
    });
  };

  const handleAddSymbol = () => {
    if (!symbolName) return;

    const newSymbol: SymbolItem = {
      id: Date.now().toString(),
      name: symbolName,
      imageUri,
    };

    setSymbols([newSymbol, ...symbols]);
    setSymbolName('');
    setImageUri(undefined);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: SymbolItem }) => (
    <View style={styles.symbolItem}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.symbolImage} />
      ) : (
        <View style={styles.placeholderIcon} />
      )}
      <Text style={styles.symbolName}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navBarTitle}>Custom Symbols</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftSide}>
          <FlatList
            data={symbols}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
          />
        </View>

        <View style={styles.dividerWrapper}>
          <View style={styles.verticalDivider} />
        </View>

        <View style={styles.rightSide}>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>Add Symbol</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Symbol</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <FontAwesomeIcon icon={faTimes} size={18} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.symbolImage} />
              ) : (
                <Text style={styles.imagePickerText}>Pick Image</Text>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Symbol Name"
              value={symbolName}
              onChangeText={setSymbolName}
              style={styles.input}
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddSymbol}>
              <Text style={styles.submitButtonText}>Add Symbol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  navBar: {
    backgroundColor: '#0077b6',
    height: 25,
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSide: {
    flex: 8.5,
    paddingLeft: 26,
    paddingRight: 26,
    padding: 5,
  },
  dividerWrapper: {
    width: 0.8,
    backgroundColor: '#000',
  },
  verticalDivider: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
  },
  rightSide: {
    flex: 1.1,
    backgroundColor: 'rgb(232, 232, 232)',
  },
  addButton: {
    width: '100%', // Make the button take up the entire width of the right side
    height: '100%', // Make the button take up the entire height of the right side
    backgroundColor: '#caf0f8',
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
    borderWidth: 2,
    borderColor: '#0077b6',
  },
  addButtonText: {
    color: '#0077b6',
    fontWeight: 'bold',
    fontSize: 18,
  },
  symbolItem: {
    width: 90,
    height: 120,
    alignItems: 'center',
    margin: 6,
  },
  symbolImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  placeholderIcon: {
    width: 90,
    height: 90,
    backgroundColor: '#ade8f4',
    borderRadius: 10,
  },
  symbolName: {
    marginTop: 6,
    fontSize: 14,
    color: '#023e8a',
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#f0f9ff',
    borderRadius: 20, // Round the corners of the modal
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0077b6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 6,
    padding: 4,
  },
  imagePicker: {
    width: 80,
    height: 80,
    backgroundColor: '#d0f0fd',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    marginVertical: 8,
  },
  imagePickerText: {
    color: '#0077b6',
    fontWeight: 'bold',
  },
  input: {
    height: 36,
    borderColor: '#0077b6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    color: '#000',
    backgroundColor: 'white',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#0077b6',
    paddingVertical: 10, // Make the button taller
    marginHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default CustomPageComponent;
