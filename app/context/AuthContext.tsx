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
import { ASYNC_STORAGE_KEYS } from '../constants/storageKeys';
import { UserType, Gender } from '../services/apiService'; // Assuming these are exported from apiService

// --- AsyncStorage Keys ---
const USER_TOKEN_KEY = ASYNC_STORAGE_KEYS.USER_TOKEN;
const USER_DATA_KEY = ASYNC_STORAGE_KEYS.USER_DATA;

// --- User Interface ---
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    age?: number;
    gender?: Gender;
    user_type: UserType;
    is_active: boolean;
    localAvatarPath?: string | null; // MODIFIED: Allow null for avatar path
}

// --- Auth Context Type Definition ---
interface AuthContextType {
    userToken: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    signIn: (token: string, userData: Omit<AuthUser, 'localAvatarPath' | 'age' | 'gender'> & { age?: number; gender?: Gender }) => Promise<void>;
    signOut: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
    loadLocalAvatarForUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadLocalAvatarForUser = useCallback(async (userId: string) => {
        if (!userId) return;
        try {
            const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${userId}`;
            const storedPath = await AsyncStorage.getItem(avatarStorageKey);
            // No console.log needed for successful load in clean version
            setUser(currentUser => currentUser ? { ...currentUser, localAvatarPath: storedPath } : null);
        } catch (e) {
            console.error('[AuthContext] Failed to load local avatar path from AsyncStorage', e);
        }
    }, []);

    useEffect(() => {
        const bootstrapAsync = async () => {
            setIsLoading(true);
            let token: string | null = null;
            let storedUserData: AuthUser | null = null;

            try {
                token = await AsyncStorage.getItem(USER_TOKEN_KEY);
                const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
                if (userDataString) {
                    storedUserData = JSON.parse(userDataString) as AuthUser;
                }
            } catch (e) {
                console.error('[AuthContext] Restoring token or user data failed', e);
                await AsyncStorage.multiRemove([USER_TOKEN_KEY, USER_DATA_KEY]);
            }

            if (token && storedUserData) {
                setUserToken(token);
                setUser(storedUserData);
                if (storedUserData.id) {
                    await loadLocalAvatarForUser(storedUserData.id);
                }
            } else {
                setUserToken(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, [loadLocalAvatarForUser]);

    const signIn = async (token: string, backendUserData: Omit<AuthUser, 'localAvatarPath' | 'age' | 'gender'> & { age?: number; gender?: Gender }) => {
        setIsLoading(true);
        try {
            // Construct AuthUser, explicitly including optional age and gender
            const fullUserData: AuthUser = {
                id: backendUserData.id,
                email: backendUserData.email,
                name: backendUserData.name,
                user_type: backendUserData.user_type,
                is_active: backendUserData.is_active,
                age: backendUserData.age, // Will be undefined if not provided
                gender: backendUserData.gender, // Will be undefined if not provided
                localAvatarPath: null, // Initialize as null
            };

            await AsyncStorage.setItem(USER_TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(fullUserData));

            setUserToken(token);
            setUser(fullUserData);

            if (fullUserData.id) {
                await loadLocalAvatarForUser(fullUserData.id);
            }
        } catch (e) {
            console.error('[AuthContext] Sign in failed to store data', e);
            // Consider re-throwing or handling more gracefully
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.multiRemove([USER_TOKEN_KEY, USER_DATA_KEY]);
            // Optionally clear specific user's avatar prefix if desired, or leave for next login
            // if (user && user.id) {
            //     const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${user.id}`;
            //     await AsyncStorage.removeItem(avatarStorageKey);
            // }
            setUserToken(null);
            setUser(null);
        } catch (e) {
            console.error('[AuthContext] Sign out failed to remove data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const authContextValue = React.useMemo(() => ({
        userToken,
        user,
        isLoading,
        signIn,
        signOut,
        setUser,
        loadLocalAvatarForUser,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [userToken, user, isLoading, loadLocalAvatarForUser]); // signIn, signOut, setUser are stable due to useCallback or being setters

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