// app/services/keychainService.ts
import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'com.communify.parentalpasscode'; // Use a unique service name

export const hasPasscode = async (): Promise<boolean> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
    return !!credentials; // True if credentials exist, false otherwise
  } catch (error) {
    console.error("Keychain Error (hasPasscode):", error);
    return false;
  }
};

export const verifyPasscode = async (passcodeToCheck: string): Promise<boolean> => {
  if (!passcodeToCheck) return false;
  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
    if (credentials) {
      return credentials.password === passcodeToCheck;
    }
    return false; // No passcode set means verification fails
  } catch (error) {
    console.error("Keychain Error (verifyPasscode):", error);
    return false;
  }
};

export const setPasscode = async (newPasscode: string): Promise<boolean> => {
   if (!newPasscode) {
        console.error("Keychain Error: Attempted to set empty passcode.");
        return false;
   }
  try {
    await Keychain.setGenericPassword('user', newPasscode, { service: SERVICE_NAME }); // Username 'user' is arbitrary here
    console.log('Keychain: Passcode set successfully.');
    return true;
  } catch (error) {
    console.error("Keychain Error (setPasscode):", error);
    return false;
  }
};

export const resetPasscode = async (): Promise<boolean> => {
    try {
        const success = await Keychain.resetGenericPassword({ service: SERVICE_NAME });
        console.log('Keychain: Passcode reset.', success);
        return success;
    } catch (error) {
        console.error("Keychain Error (resetPasscode):", error);
        return false;
    }
};