import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDesktop, faShapes, faThLarge, faUserShield, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import DisplayOptions from './DisplayOptions';
import SelectionMode from './SelectionMode'; 
import ParentalControls from './ParentalControls'; 
import SymbolVoiceOver from './SymbolVoiceOver'; 
import AboutUs from './AboutUs'; 


interface MenuProps {
  slideAnim: Animated.Value;
  overlayAnim: Animated.Value;
  closeMenu: () => void;
}

const menuItems = [
  { icon: faDesktop, label: 'Display Options' },
  { icon: faShapes, label: 'Symbol Selection Mode' },
  { icon: faThLarge, label: 'Symbol Voice-Over' },
  { icon: faUserShield, label: 'Parental Control' },
  { icon: faInfoCircle, label: 'About Us' },
];

const Menu: React.FC<MenuProps> = ({ slideAnim, overlayAnim, closeMenu }) => {
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showSelectionMode, setShowSelectionMode] = useState(false); // State for SelectionMode modal
  const [showParentalControls, setShowParentalControls] = useState(false); // State for ParentalControls modal
  const [showSymbolVoiceOver, setShowSymbolVoiceOver] = useState(false); // State for SymbolVoiceOver modal
  const [showAboutUs, setShowAboutUs] = useState(false); // State for AboutUs modal


  const handleMenuPress = (label: string) => {
    if (label === 'Display Options') {
      setShowDisplayOptions(true);
    }
    if (label === 'Symbol Selection Mode') {
      setShowSelectionMode(true); // Show SelectionMode modal when this item is pressed
    }
    if (label === 'Parental Control') {
      setShowParentalControls(true); // Show ParentalControls modal when this item is pressed
    }
    if (label === 'Symbol Voice-Over') {
      setShowSymbolVoiceOver(true); // Show SymbolVoiceOver modal when this item is pressed
    }
    if (label === 'About Us') {
      setShowAboutUs(true); // Show AboutUs modal when this item is pressed
    }
  };
  

  return (
    <View style={styles.modalContainer}>
      {/* Overlay to close menu */}
      <TouchableOpacity style={[styles.overlay, { opacity: overlayAnim }]} activeOpacity={1} onPress={closeMenu} />

      {/* Side Menu */}
      <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.title}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item.label)}>
            <FontAwesomeIcon icon={item.icon} size={18} style={styles.icon} />
            <Text style={styles.menuText}>{item.label}</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* DisplayOptions Modal */}
      <Modal visible={showDisplayOptions} animationType="slide" transparent={true}>
        <DisplayOptions visible={showDisplayOptions} onClose={() => setShowDisplayOptions(false)} />
      </Modal>

      {/* SelectionMode Modal */}
      <Modal visible={showSelectionMode} animationType="slide" transparent={true}>
        <SelectionMode visible={showSelectionMode} onClose={() => setShowSelectionMode(false)} />
      </Modal>

      {/* ParentalControls Modal */}
      <Modal visible={showParentalControls} animationType="slide" transparent={true}>
        <ParentalControls visible={showParentalControls} onClose={() => setShowParentalControls(false)} />
      </Modal>

      {/* SymbolVoiceOver Modal */}
      <Modal visible={showSymbolVoiceOver} animationType="fade" transparent={true}>
        <SymbolVoiceOver visible={showSymbolVoiceOver} onClose={() => setShowSymbolVoiceOver(false)} />
      </Modal>
     {/* AboutUs Modal */}
      <Modal visible={showAboutUs} animationType="slide" transparent={true}>
  <AboutUs visible={showAboutUs} onClose={() => setShowAboutUs(false)} />
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    backgroundColor: '#0077b6',
    width: '30%',
    height: '100%',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 15,
    flex: 1,
  },
  arrow: {
    fontSize: 18,
    color: 'black',
  },
});

export default Menu;
