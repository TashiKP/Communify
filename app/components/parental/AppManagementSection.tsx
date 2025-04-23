// src/components/parental/AppManagementSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMobileAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Define props
interface AppManagementSectionProps {
    onConfigureApps: () => void;
    styles: any; // Pass down shared styles object
}

const AppManagementSection: React.FC<AppManagementSectionProps> = ({
    onConfigureApps,
    styles
}) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faMobileAlt} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>App Management</Text>
            </View>
            {/* Configure Apps Link */}
            <View style={styles.cardFooter}>
               <TouchableOpacity style={styles.featureRow} onPress={onConfigureApps} activeOpacity={0.6}>
                   <FontAwesomeIcon icon={faMobileAlt} size={18} color={styles._darkGrey} style={styles.featureIcon}/>
                   <Text style={styles.featureLabel}>Allowed Apps & Limits</Text>
                   <FontAwesomeIcon icon={faChevronRight} size={16} color={styles._placeholderColor} />
               </TouchableOpacity>
            </View>
       </View>
    );
};

export default AppManagementSection;