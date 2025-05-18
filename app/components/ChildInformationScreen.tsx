import React, { useMemo, useState, useEffect } from 'react';
import {
    View, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity,
    Text,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faUser, faChild, faDisplay, faLock, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';
import BioCard from './ChildInformation/BioCard';
import ProfileSection from './ChildInformation/ProfileSection';
import AppearanceSection from './ChildInformation/AppearanceSection';
import PasswordModal from './ChildInformation/PasswordModal';
import { ChildData } from './ChildInformation/types';

interface ChildInformationScreenProps {
    childData: ChildData;
    onClose: () => void;
    onSave?: (data: ChildData) => void;
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const ChildInformationScreen: React.FC<ChildInformationScreenProps> = ({ childData: initialChildData, onClose, onSave }) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [childData, setChildData] = useState<ChildData>(initialChildData);
    const [expandedSection, setExpandedSection] = useState<string>('personalInfo');
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [password, setPassword] = useState<string | null>(null);
    const heightAnimProfile = useState(new Animated.Value(0))[0];
    const heightAnimAppearance = useState(new Animated.Value(0))[0];
    const heightAnimSecurity = useState(new Animated.Value(0))[0];

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    const toggleSection = (section: string) => {
        const isExpanding = expandedSection !== section;
        setExpandedSection(isExpanding ? section : '');

        const heightAnim = 
            section === 'childProfile' ? heightAnimProfile :
            section === 'appearanceSettings' ? heightAnimAppearance :
            heightAnimSecurity;
        Animated.timing(heightAnim, {
            toValue: isExpanding ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleUpdatePassword = (newPassword: string) => {
        if (newPassword.length < 6) {
            Alert.alert(t('common.error'), t('childInformation.passwordTooShort'));
            return;
        }
        setPassword(newPassword);
        setIsPasswordModalVisible(false);
        Alert.alert(t('common.success'), t('childInformation.passwordUpdated'));
    };

    const handleSaveBio = (updatedData: ChildData) => {
        setChildData(updatedData);
        if (onSave) {
            onSave(updatedData);
        }
    };

    const capitalize = (str: string | undefined) => 
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : 'N/A';

    return (
        <SafeAreaView style={styles.screenContainer}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={onClose}
                    hitSlop={hitSlop}
                    accessibilityLabel={t('common.goBack')}
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.7} color={theme.white} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.white }]} numberOfLines={1}>
                        {t('childInformation.title')}
                    </Text>
                </View>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
                {/* Display Child Information Directly */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>{t('childInformation.personalInfo')}</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('childInformation.name')}:</Text>
                        <Text style={styles.infoValue}>{childData.user.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('childInformation.age')}:</Text>
                        <Text style={styles.infoValue}>{childData.user.age || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('childInformation.gender')}:</Text>
                        <Text style={styles.infoValue}>
                            {childData.user.gender ? capitalize(childData.user.gender) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('childInformation.email')}:</Text>
                        <Text style={styles.infoValue}>{childData.user.email || 'N/A'}</Text>
                    </View>
                </View>

                {/* Edit Personal Information Section */}
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('personalInfo')}
                        accessibilityRole="button"
                        accessibilityLabel={t('childInformation.personalInfo')}
                    >
                        <FontAwesomeIcon icon={faUser} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('childInformation.editPersonalInfo')}
                        </Text>
                        <FontAwesomeIcon
                            icon={expandedSection === 'personalInfo' ? faChevronUp : faChevronDown}
                            size={fonts.body * 0.9}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    {expandedSection === 'personalInfo' && (
                        <BioCard childData={childData} onSave={handleSaveBio} />
                    )}
                </View>

                {/* Child Profile Section */}
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('childProfile')}
                        accessibilityRole="button"
                        accessibilityLabel={t('childInformation.childProfile')}
                    >
                        <FontAwesomeIcon icon={faChild} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('childInformation.childProfile')}
                        </Text>
                        <FontAwesomeIcon
                            icon={expandedSection === 'childProfile' ? faChevronUp : faChevronDown}
                            size={fonts.body * 0.9}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    {expandedSection === 'childProfile' && (
                        <Animated.View
                            style={{
                                opacity: heightAnimProfile,
                                height: heightAnimProfile.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 600],
                                }),
                                overflow: 'hidden',
                            }}
                        >
                            <ProfileSection childData={childData} />
                        </Animated.View>
                    )}
                </View>

                {/* Appearance Settings Section */}
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('appearanceSettings')}
                        accessibilityRole="button"
                        accessibilityLabel={t('childInformation.appearanceSettings')}
                    >
                        <FontAwesomeIcon icon={faDisplay} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('childInformation.appearanceSettings')}
                        </Text>
                        <FontAwesomeIcon
                            icon={expandedSection === 'appearanceSettings' ? faChevronUp : faChevronDown}
                            size={fonts.body * 0.9}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    {expandedSection === 'appearanceSettings' && (
                        <Animated.View
                            style={{
                                opacity: heightAnimAppearance,
                                height: heightAnimAppearance.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 500],
                                }),
                                overflow: 'hidden',
                            }}
                        >
                            <AppearanceSection childData={childData} />
                        </Animated.View>
                    )}
                </View>

                {/* Security Settings Section */}
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('securitySettings')}
                        accessibilityRole="button"
                        accessibilityLabel={t('childInformation.securitySettings')}
                    >
                        <FontAwesomeIcon icon={faLock} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('childInformation.securitySettings')}
                        </Text>
                        <FontAwesomeIcon
                            icon={expandedSection === 'securitySettings' ? faChevronUp : faChevronDown}
                            size={fonts.body * 0.9}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    {expandedSection === 'securitySettings' && (
                        <Animated.View
                            style={{
                                opacity: heightAnimSecurity,
                                height: heightAnimSecurity.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 150],
                                }),
                                overflow: 'hidden',
                            }}
                        >
                            <LinearGradient
                                colors={[theme.card, theme.background]}
                                style={{ padding: 20, borderRadius: 12 }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                                    <FontAwesomeIcon icon={faLock} size={fonts.body * 0.9} color={theme.primary} style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            ...getLanguageSpecificTextStyle('body', fonts, 'en'),
                                            fontSize: (fonts.body || 16) * 0.9,
                                            fontWeight: '700',
                                            color: theme.text,
                                        }}>
                                            {t('childInformation.password')}
                                        </Text>
                                        <Text style={{
                                            ...getLanguageSpecificTextStyle('body', fonts, 'en'),
                                            fontSize: (fonts.body || 16) * 0.8,
                                            fontWeight: '500',
                                            color: theme.textSecondary,
                                        }}>
                                            {password ? '********' : t('childInformation.noPasswordSet')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{
                                        paddingVertical: 12,
                                        paddingHorizontal: 10,
                                        backgroundColor: theme.primary,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        marginTop: 10,
                                    }}
                                    onPress={() => setIsPasswordModalVisible(true)}
                                    accessibilityLabel={t('childInformation.updatePassword')}
                                >
                                    <Text style={{
                                        ...getLanguageSpecificTextStyle('body', fonts, 'en'),
                                        fontSize: (fonts.body || 16) * 0.9,
                                        color: theme.white,
                                        fontWeight: '600',
                                    }}>
                                        {t('common.update')}
                                    </Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            <PasswordModal
                isVisible={isPasswordModalVisible}
                onClose={() => setIsPasswordModalVisible(false)}
                onSave={handleUpdatePassword}
            />
        </SafeAreaView>
    );
};

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const h2FontSize = fonts.h2 || 20;
    const bodyFontSize = fonts.body || 16;
    const labelFontSize = fonts.label || 14;

    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

    return StyleSheet.create({
        screenContainer: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        header: {
            backgroundColor: theme.primary,
            paddingTop: Platform.OS === 'android' ? 10 : 0,
            paddingBottom: 12,
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        titleContainer: {
            flex: 1,
            alignItems: 'center',
            marginHorizontal: 5,
        },
        title: {
            ...h2Styles,
            fontSize: h2FontSize,
            fontWeight: '700',
            textAlign: 'center',
            color: theme.white,
        },
        headerButton: {
            padding: 10,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContentContainer: {
            flexGrow: 1,
            backgroundColor: theme.background,
            padding: 18,
            paddingBottom: 40,
        },
        infoContainer: {
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 18,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            shadowColor: theme.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.2 : 0.08,
            shadowRadius: 2,
            elevation: 1,
        },
        infoTitle: {
            ...labelStyles,
            fontSize: labelFontSize,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 15,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8,
        },
        infoLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '600',
            color: theme.text,
            marginRight: 10,
        },
        infoValue: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            color: theme.textSecondary,
            flex: 1,
        },
        sectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            shadowColor: theme.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.2 : 0.08,
            shadowRadius: 2,
            elevation: 1,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 18,
        },
        sectionIcon: {
            marginRight: 12,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        sectionTitle: {
            ...labelStyles,
            fontSize: labelFontSize,
            fontWeight: '700',
            flex: 1,
            color: theme.text,
        },
    });
};

export default ChildInformationScreen;