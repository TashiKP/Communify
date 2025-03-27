import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faDesktop, 
  faShapes, 
  faThLarge, 
  faUserShield, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';

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
  return (
    <View style={styles.modalContainer}>
      {/* Touchable overlay to close the menu */}
      <TouchableOpacity style={[styles.overlay, { opacity: overlayAnim }]} activeOpacity={1} onPress={closeMenu} />
      
      {/* Side menu */}
      <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.title}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <FontAwesomeIcon icon={item.icon} size={18} style={styles.icon} />
            <Text style={styles.menuText}>{item.label}</Text>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
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
    fontSize: 12,
    flex: 1,
  },
  arrow: {
    fontSize: 18,
    color: 'black',
  },
});

export default Menu;
