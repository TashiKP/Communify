// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ASYNC_STORAGE_KEYS} from '../constants/storageKeys';
import {UserType, Gender} from '../services/apiService';

const USER_TOKEN_KEY = ASYNC_STORAGE_KEYS.USER_TOKEN;
const USER_DATA_KEY = ASYNC_STORAGE_KEYS.USER_DATA;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: Gender;
  userType: UserType;
  isActive: boolean;
  localAvatarPath?: string | null;
}

interface AuthContextType {
  userToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  // MODIFIED: signIn signature to accept initialLocalAvatarPath
  signIn: (
    token: string,
    userData: Omit<AuthUser, 'localAvatarPath'>,
    initialLocalAvatarPath?: string | null,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  updateUserAvatarInContextAndStorage: (
    userId: string,
    newLocalPath: string | null,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({children}) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This helper is now primarily for bootstrapAsync
  const loadAvatarPathFromStorage = useCallback(
    async (userId: string): Promise<string | null> => {
      console.log(
        '[AuthContext] loadAvatarPathFromStorage CALLED for userId:',
        userId,
      );
      if (!userId) {
        console.warn(
          '[AuthContext] loadAvatarPathFromStorage called without valid userId.',
        );
        return null;
      }
      try {
        const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${userId}`;
        console.log(
          '[AuthContext] Attempting to load avatar from key:',
          avatarStorageKey,
        );
        const storedPath = await AsyncStorage.getItem(avatarStorageKey);
        console.log(
          '[AuthContext] Path loaded from AsyncStorage for key',
          avatarStorageKey,
          ':',
          storedPath,
        );
        return storedPath;
      } catch (e) {
        console.error(
          '[AuthContext] Failed to load local avatar path for user:',
          userId,
          e,
        );
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      setIsLoading(true);
      let token: string | null = null;
      let finalUserToSet: AuthUser | null = null;
      console.log('[AuthContext] bootstrapAsync CALLED.');

      try {
        token = await AsyncStorage.getItem(USER_TOKEN_KEY);
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);

        if (userDataString) {
          const basicUserData = JSON.parse(userDataString) as Omit<
            AuthUser,
            'localAvatarPath'
          >;
          if (basicUserData && basicUserData.id) {
            console.log(
              '[AuthContext] bootstrap: Basic user data found, ID:',
              basicUserData.id,
            );
            const avatarPath = await loadAvatarPathFromStorage(
              basicUserData.id,
            );
            finalUserToSet = {...basicUserData, localAvatarPath: avatarPath};
            console.log(
              '[AuthContext] bootstrap: User data AFTER loading avatar path:',
              JSON.stringify(finalUserToSet, null, 2),
            );
          } else {
            console.log(
              '[AuthContext] bootstrap: Basic user data from AsyncStorage is invalid or missing ID.',
            );
          }
        } else {
          console.log(
            '[AuthContext] bootstrap: No user data string found in AsyncStorage (USER_DATA_KEY).',
          );
        }
      } catch (e) {
        console.error(
          '[AuthContext] Restoring session from AsyncStorage failed:',
          e,
        );
        await AsyncStorage.multiRemove([USER_TOKEN_KEY, USER_DATA_KEY]);
      }

      if (token && finalUserToSet) {
        setUserToken(token);
        setUser(finalUserToSet);
      } else {
        setUserToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };
    bootstrapAsync();
  }, [loadAvatarPathFromStorage]);

  // MODIFIED: signIn function to accept and use initialLocalAvatarPath
  const signIn = async (
    token: string,
    backendUserData: Omit<AuthUser, 'localAvatarPath'>,
    initialLocalAvatarPath?: string | null, // Provided during signup flow
  ) => {
    setIsLoading(true);
    console.log(
      '[AuthContext] signIn CALLED. Backend user ID:',
      backendUserData.id,
      'Initial Avatar Path provided:',
      initialLocalAvatarPath,
    );
    try {
      // Construct the full user object for the context
      const fullUserData: AuthUser = {
        ...backendUserData, // id, email, name, userType, isActive from backend
        localAvatarPath:
          initialLocalAvatarPath !== undefined ? initialLocalAvatarPath : null,
      };

      await AsyncStorage.setItem(USER_TOKEN_KEY, token);
      // Store basic user data (without localAvatarPath explicitly here, as bootstrap loads it separately)
      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify(backendUserData),
      );

      setUserToken(token);
      setUser(fullUserData); // Set user in context WITH the initial avatar path if provided
      console.log(
        '[AuthContext] signIn: User SET in context:',
        JSON.stringify(fullUserData, null, 2),
      );

      // If an initialLocalAvatarPath was provided (typically during signup),
      // ensure it's persisted in AsyncStorage under its specific key for future bootstraps.
      if (fullUserData.id && initialLocalAvatarPath !== undefined) {
        const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${fullUserData.id}`;
        if (initialLocalAvatarPath) {
          // If path is a string URI
          console.log(
            `[AuthContext] signIn: Saving initial avatar path to AsyncStorage. Key: ${avatarStorageKey}, Path: ${initialLocalAvatarPath}`,
          );
          await AsyncStorage.setItem(avatarStorageKey, initialLocalAvatarPath);
        } else {
          // If path is explicitly null (meaning remove/no avatar from signup)
          console.log(
            `[AuthContext] signIn: Removing avatar path from AsyncStorage (initial path was null). Key: ${avatarStorageKey}`,
          );
          await AsyncStorage.removeItem(avatarStorageKey);
        }
      }
      // If initialLocalAvatarPath was undefined, bootstrapAsync will try to load it on next app start.
    } catch (e) {
      console.error('[AuthContext] Sign in failed:', e);
      await AsyncStorage.multiRemove([USER_TOKEN_KEY, USER_DATA_KEY]);
      setUserToken(null);
      setUser(null);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    console.log('[AuthContext] signOut CALLED.');
    try {
      await AsyncStorage.multiRemove([USER_TOKEN_KEY, USER_DATA_KEY]);
      // Avatar path for the user (user_avatar_uri_USERID) remains in AsyncStorage
      setUserToken(null);
      setUser(null);
      console.log(
        '[AuthContext] User signed out. Token and USER_DATA_KEY cleared. Avatar paths persist.',
      );
    } catch (e) {
      console.error(
        '[AuthContext] Sign out failed during AsyncStorage operation:',
        e,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserAvatarInContextAndStorage = useCallback(
    async (userId: string, newLocalPath: string | null) => {
      console.log(
        `[AuthContext] updateUserAvatarInContextAndStorage CALLED for userId: ${userId}, newPath: ${newLocalPath}`,
      );
      if (!userId) {
        console.error(
          '[AuthContext] updateUserAvatarInContextAndStorage: No userId provided.',
        );
        return;
      }
      const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${userId}`;
      try {
        if (newLocalPath) {
          await AsyncStorage.setItem(avatarStorageKey, newLocalPath);
        } else {
          await AsyncStorage.removeItem(avatarStorageKey);
        }
        setUser(currentUser => {
          if (currentUser && currentUser.id === userId) {
            return {...currentUser, localAvatarPath: newLocalPath};
          }
          return currentUser;
        });
      } catch (e) {
        console.error(
          '[AuthContext] Failed to update local avatar path in context/storage:',
          e,
        );
      }
    },
    [],
  ); // setUser is stable

  const authContextValue = React.useMemo(
    () => ({
      userToken,
      user,
      isLoading,
      signIn,
      signOut,
      setUser,
      updateUserAvatarInContextAndStorage,
    }),
    [
      userToken,
      user,
      isLoading,
      signIn,
      signOut,
      setUser,
      updateUserAvatarInContextAndStorage,
    ],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
