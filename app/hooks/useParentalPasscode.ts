// src/hooks/useParentalPasscode.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import apiService, { handleApiError } from '../services/apiService'; // Adjust path
import * as KeychainService from '../services/keychainService'; // Adjust path
import { TFunction } from 'i18next';
// ParentalSettingsData is not directly used here, can be removed if not needed by other logic in this file.

interface UseParentalPasscodeProps {
  t: TFunction;
  onPasscodeStateChange?: (exists: boolean) => void; // Optional callback
  updateRequirePasscodeSetting: (value: boolean) => void; // To sync with general settings
}

export const useParentalPasscode = ({
  t,
  onPasscodeStateChange,
  updateRequirePasscodeSetting,
}: UseParentalPasscodeProps) => {
  const [passcodeExists, setPasscodeExists] = useState(false);
  const [isLoadingPasscodeStatus, setIsLoadingPasscodeStatus] = useState(true); // True initially
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearPasscodeForm = useCallback(() => {
    setCurrentPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');
    setPasscodeError(null);
    setPasscodeSuccess(null);
  }, []); // No dependencies, stable.

  const checkPasscodeStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    console.log("useParentalPasscode: Checking passcode status...");
    setIsLoadingPasscodeStatus(true);
    try {
      const backendStatus = await apiService.checkBackendHasParentalPasscode();
      if (isMountedRef.current) {
        setPasscodeExists(backendStatus.exists);
        onPasscodeStateChange?.(backendStatus.exists);
        console.log("useParentalPasscode: Passcode status checked. Exists:", backendStatus.exists);
      }
    } catch (error) {
      console.error('useParentalPasscode: Failed to check passcode status:', error);
      if (isMountedRef.current) {
        setPasscodeExists(false);
        onPasscodeStateChange?.(false);
        Alert.alert(t('common.error'), t('parentalControls.errors.passcodeStatusFail'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingPasscodeStatus(false);
      }
    }
  }, [t, onPasscodeStateChange]); // `onPasscodeStateChange` should be stable if provided from parent.

  const togglePasscodeSetup = useCallback(() => {
    setShowPasscodeSetup((prev) => {
      const nextState = !prev;
      if (nextState) {
        clearPasscodeForm(); // Clear form when opening
      } else {
        Keyboard.dismiss();
      }
      return nextState;
    });
  }, [clearPasscodeForm]); // Depends on stable `clearPasscodeForm`.

  const handleSetOrUpdatePasscode = useCallback(async () => {
    Keyboard.dismiss();
    setPasscodeError(null);
    setPasscodeSuccess(null);

    if (passcodeExists && !currentPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorEnterCurrent')); return;
    }
    if (!newPasscode || newPasscode.length < 4) {
      setPasscodeError(t('parentalControls.passcode.errorNewMinLength')); return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorMismatch')); return;
    }

    setIsSettingPasscode(true);
    try {
      if (passcodeExists) {
        const keychainVerified = await KeychainService.verifyPasscode(currentPasscode);
        if (!keychainVerified) {
          setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent'));
          setIsSettingPasscode(false); return;
        }
      }
      const apiResponse = await apiService.setOrUpdateParentalPasscodeOnBackend(newPasscode, passcodeExists ? currentPasscode : undefined);
      if (!apiResponse.success) {
        setPasscodeError(apiResponse.message || t('parentalControls.passcode.errorApiSaveFailed'));
        setIsSettingPasscode(false); return;
      }

      await KeychainService.setPasscode(newPasscode);
      setPasscodeSuccess(t('parentalControls.passcode.successSetUpdate'));
      setPasscodeExists(true);
      onPasscodeStateChange?.(true);
      updateRequirePasscodeSetting(true); // Update the global setting state

      setTimeout(() => {
        if (isMountedRef.current) {
          togglePasscodeSetup(); // Close the form
          // Optionally, show an alert for first-time setup success
        }
      }, 1500);
    } catch (error) {
      const apiError = handleApiError(error);
      setPasscodeError(apiError.message || t('parentalControls.passcode.errorUnexpected'));
    } finally {
      if (isMountedRef.current) {
        setIsSettingPasscode(false);
      }
    }
  }, [
    passcodeExists, currentPasscode, newPasscode, confirmPasscode, // State values, will cause regen, fine.
    t, togglePasscodeSetup, onPasscodeStateChange, updateRequirePasscodeSetting // Callbacks/stable values.
  ]);

  const handleRemovePasscodeClick = useCallback(async () => {
    Keyboard.dismiss();
    setPasscodeError(null); // Clear previous errors
    setPasscodeSuccess(null);

    if (!currentPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorEnterCurrentToRemove'));
      return;
    }

    Alert.alert(
        t('parentalControls.passcode.removeConfirmTitle'),
        t('parentalControls.passcode.removeConfirmMessage'),
        [
            { text: t('common.cancel'), style: 'cancel'},
            {
                text: t('common.remove'),
                style: 'destructive',
                onPress: async () => {
                    setIsSettingPasscode(true);
                    try {
                        const keychainVerified = await KeychainService.verifyPasscode(currentPasscode);
                        if(!keychainVerified) {
                            setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent'));
                            setIsSettingPasscode(false); return;
                        }
                        const apiResponse = await apiService.removeParentalPasscodeOnBackend(currentPasscode);
                        if(!apiResponse.success) {
                            setPasscodeError(apiResponse.message || t('parentalControls.passcode.errorApiRemoveFailed'));
                            setIsSettingPasscode(false); return;
                        }
                        await KeychainService.resetPasscode();
                        setPasscodeSuccess(t('parentalControls.passcode.successRemoved'));
                        setPasscodeExists(false);
                        onPasscodeStateChange?.(false);
                        updateRequirePasscodeSetting(false); // Update global setting state
                        setCurrentPasscode(''); // Clear current passcode from form
                        setTimeout(() => { if (isMountedRef.current) togglePasscodeSetup(); }, 1500);
                    } catch (error) {
                        const apiError = handleApiError(error);
                        setPasscodeError(apiError.message || t('parentalControls.passcode.errorUnexpected'));
                    } finally {
                        if (isMountedRef.current) setIsSettingPasscode(false);
                    }
                }
            }
        ]
    );
  }, [
    currentPasscode, // State value
    t, togglePasscodeSetup, onPasscodeStateChange, updateRequirePasscodeSetting // Callbacks/stable
  ]);

  return {
    passcodeExists,
    isLoadingPasscodeStatus,
    showPasscodeSetup,
    currentPasscode, setCurrentPasscode, // Expose setters for the form
    newPasscode, setNewPasscode,
    confirmPasscode, setConfirmPasscode,
    isSettingPasscode,
    passcodeError,
    passcodeSuccess,
    checkPasscodeStatus, // Stable
    togglePasscodeSetup, // Stable
    handleSetOrUpdatePasscode, // Regenerates when form inputs change, fine.
    handleRemovePasscodeClick, // Regenerates when currentPasscode changes, fine.
    // clearPasscodeForm, // No longer needs to be exposed if togglePasscodeSetup calls it.
  };
};