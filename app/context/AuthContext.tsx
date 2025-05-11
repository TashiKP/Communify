// src/context/AuthContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode,
    FC,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_TOKEN_KEY = 'userToken';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    userToken: string | null;
    isLoading: boolean;
    signIn: (token: string, userData?: User) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // true for initial bootstrap

    useEffect(() => {
        const bootstrapAsync = async () => {
            console.log('[AuthContext] Bootstrapping: Attempting to load token...');
            let token: string | null = null;
            try {
                token = await AsyncStorage.getItem(USER_TOKEN_KEY);
                console.log('[AuthContext] Token from AsyncStorage on bootstrap:', token);
            } catch (e) {
                console.error('[AuthContext] Restoring token failed', e);
            }

            if (token) {
                setUserToken(token);
                console.log('[AuthContext] Token found and set.');
            } else {
                console.log('[AuthContext] No token found in AsyncStorage.');
            }
            setIsLoading(false);
            console.log('[AuthContext] Bootstrapping finished. isLoading set to false.');
        };

        bootstrapAsync();
    }, []);

    const signIn = async (token: string, userData?: User) => {
        console.log('[AuthContext] signIn called. Token:', token);
        setIsLoading(true); // Set loading true for the duration of the sign-in process
        try {
            await AsyncStorage.setItem(USER_TOKEN_KEY, token);
            setUserToken(token);
            console.log('[AuthContext] User signed in, token and data (if any) stored.');
        } catch (e) {
            console.error('[AuthContext] Sign in failed to store data', e);
        } finally {
            setIsLoading(false); // Ensure isLoading is false after sign-in attempt
        }
    };

    const signOut = async () => {
        console.log('[AuthContext] signOut called.');
        setIsLoading(true); // Set loading true for the duration of the sign-out process
        try {
            await AsyncStorage.removeItem(USER_TOKEN_KEY);
            setUserToken(null);
            console.log('[AuthContext] User signed out, token and data (if any) removed.');
        } catch (e) {
            console.error('[AuthContext] Sign out failed to remove data', e);
        } finally {
            setIsLoading(false); // Ensure isLoading is false after sign-out attempt
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
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
