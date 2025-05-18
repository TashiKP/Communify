import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Text, StyleSheet, Alert} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useAppearance} from '../context/AppearanceContext';
import {useTranslation} from 'react-i18next';

const LoggingOutScreen: React.FC = () => {
  const {signOut} = useAuth();
  const {theme, fonts} = useAppearance();
  const {t} = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log('[LoggingOutScreen] Mounted, preparing to sign out.');

    const performLogout = async () => {
      try {
        await signOut();
        if (isMounted) {
          console.log('[LoggingOutScreen] signOut successful.');
          // Add a slight delay to allow React Native to finish cleanup
          await new Promise(resolve => setTimeout(resolve, 100));
          setIsLoggingOut(false);
        }
      } catch (error) {
        console.error('[LoggingOutScreen] Logout failed:', error);
        if (isMounted) {
          Alert.alert(
            t('profile.logoutErrorTitle', 'Logout Failed'),
            t(
              'profile.logoutErrorMessage',
              'Could not log out. Please try again.',
            ),
          );
          setIsLoggingOut(false);
        }
      }
    };

    performLogout();

    return () => {
      isMounted = false;
      console.log('[LoggingOutScreen] Unmounted.');
    };
  }, [signOut, t]);

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {isLoggingOut ? (
        <>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text
            style={[styles.text, {color: theme.text, fontSize: fonts.body}]}>
            {t('loggingOut', 'Logging out...')}
          </Text>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
  },
});

export default LoggingOutScreen;
