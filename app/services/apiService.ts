// app/services/apiService.ts
import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

const ACCESS_TOKEN_KEY = 'communify_access_token';

// --- Token Management ---
const storeToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
        console.error('[ApiService] Failed to store token:', e);
    }
};

const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('[ApiService] Failed to retrieve token:', e);
        return null;
    }
};

const removeToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('[ApiService] Failed to remove token:', e);
    }
};
// --- End Token Management ---


// --- Define Enums ---
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type UserType = "parent" | "child" | "admin";
export type UserStatus = "active" | "inactive" | "pending" | "deactivated";
export type AsdLevel = "low" | "medium" | "high" | "noAsd";
export type GridLayoutType = "simple" | "standard" | "dense";


// --- Define API Data Structures (Types/Interfaces) ---
export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserRead {
    id: string;
    email: string;
    name: string;
    age?: number;
    gender?: Gender;
    is_active: boolean;
    user_type: UserType;
    created_at: string;
    updated_at: string;
}

export interface UserRegisterPayload {
    email: string;
    name: string;
    password: string;
    age?: number;
    gender?: Gender;
}

export interface UserUpdatePayload {
    name?: string;
    age?: number;
    gender?: Gender;
}

export interface UserPasswordUpdatePayload {
    current_password: string;
    new_password: string;
}

export interface ParentalSettingsValueUpdate {
    asd_level?: AsdLevel;
    block_inappropriate?: boolean;
    block_violence?: boolean;
    daily_limit_hours?: string;
    data_sharing_preference?: boolean;
    downtime_days?: string[];
    downtime_enabled?: boolean;
    downtime_end?: string;
    downtime_start?: string;
    notify_emails?: string[];
    require_passcode?: boolean;
}

export interface ParentalSettingsUpdatePayload {
    description?: string;
    summary?: string;
    value: Partial<ParentalSettingsValueUpdate>;
}

export interface ParentalSettingsRead {
    id: string;
    asd_level?: AsdLevel;
    block_inappropriate?: boolean;
    block_violence?: boolean;
    daily_limit_hours?: string;
    data_sharing_preference?: boolean;
    downtime_days?: string[];
    downtime_enabled?: boolean;
    downtime_end?: string;
    downtime_start?: string;
    notify_emails?: string[];
    require_passcode?: boolean;
}

export interface AppearanceSettingsUpdatePayload {
    brightness?: number;
    contrast_mode?: string;
    dark_mode_enabled?: boolean;
    font_size?: string;
    selection_mode?: string;
    symbol_grid_layout?: GridLayoutType;
    tts_highlight_word?: boolean;
    tts_pitch?: number;
    tts_selected_voice_id?: string;
    tts_speak_punctuation?: boolean;
    tts_speed?: number;
    tts_volume?: number;
    theme?: string;
}

export interface AppearanceSettingsRead {
    id: string;
    brightness?: number;
    contrast_mode?: string;
    dark_mode_enabled?: boolean;
    font_size?: string;
    selection_mode?: string;
    symbol_grid_layout?: GridLayoutType;
    tts_highlight_word?: boolean;
    tts_pitch?: number;
    tts_selected_voice_id?: string;
    tts_speak_punctuation?: boolean;
    tts_speed?: number;
    tts_volume?: number;
    theme?: string;
}

export interface AdminUserCreatePayload extends UserRegisterPayload {
    user_type: UserType;
    is_active?: boolean;
}

export interface AdminUserUpdatePayload {
    name?: string;
    age?: number;
    gender?: Gender;
    is_active?: boolean;
    user_type?: UserType;
}

export interface ListUsersParams {
    skip?: number;
    limit?: number;
    user_type?: UserType | null;
    status?: UserStatus | null;
    email_search?: string | null;
    name_search?: string | null;
}

export interface ValidationErrorDetail {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: any;
    ctx?: Record<string, any>;
}

export interface HTTPValidationError {
    detail: ValidationErrorDetail[] | string;
}

// --- NEW Symbol API Types ---
export interface StandardCategorySymbolMap {
    // The API returns a dynamic object where keys are category names (strings)
    // and values are arrays of symbol keywords (strings).
    // Example: { "food": ["apple", "banana"], "actions": ["eat", "drink"] }
    [categoryName: string]: string[];
}

export type TimeContextSymbolsResponse = string[]; // API returns an array of symbol keywords
// --- End Types ---


// --- Axios Instance Setup ---
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Accept': 'application/json' },
    timeout: 15000,
});

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const noAuthUrls = ['/auth/token', '/auth/register'];
        const requiresAuth = !noAuthUrls.some(noAuthUrl => config.url?.includes(noAuthUrl));
        if (requiresAuth) {
            const token = await getToken();
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                console.warn(`[ApiService] No token for authenticated request: ${config.url}`);
            }
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[ApiService] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            console.warn('[ApiService] 401 Unauthorized. Potential token expiry. Logging out.');
            originalRequest._retry = true;
            await removeToken();
            // TODO: Implement global navigation or state update to redirect to login
            // Example: eventEmitter.emit('logout');
        }
        return Promise.reject(error);
    }
);
// --- End Axios Interceptors ---


// --- API Service Object ---
const apiService = {
    // Authentication
    login: async (email: string, password: string): Promise<TokenResponse> => {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', email);
        params.append('password', password);
        const response = await apiClient.post<TokenResponse>(
            '/api/v1/auth/token',
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (response.data.access_token) {
            await storeToken(response.data.access_token);
        } else {
             throw new Error('Login successful but no token received.');
        }
        return response.data;
    },
    register: async (payload: UserRegisterPayload): Promise<UserRead> => {
        const response = await apiClient.post<UserRead>('/api/v1/auth/register', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },
    logout: async (): Promise<void> => {
        await removeToken();
    },

    // Current User
    getCurrentUser: async (): Promise<UserRead> => {
        const response = await apiClient.get<UserRead>('/api/v1/users/me');
        return response.data;
    },
    updateCurrentUserProfile: async (payload: UserUpdatePayload): Promise<UserRead> => {
        const response = await apiClient.patch<UserRead>('/api/v1/users/me', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },
    updateCurrentUserPassword: async (payload: UserPasswordUpdatePayload): Promise<void> => {
        await apiClient.put('/api/v1/users/me/password', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
    },
    deactivateCurrentUserAccount: async (): Promise<void> => {
        await apiClient.post('/api/v1/users/me/deactivate');
    },

    // User Settings
    getParentalSettings: async (): Promise<ParentalSettingsRead> => {
        const response = await apiClient.get<ParentalSettingsRead>('/api/v1/settings/parental');
        return response.data;
    },
    updateParentalSettings: async (payload: ParentalSettingsUpdatePayload): Promise<ParentalSettingsRead> => {
        const response = await apiClient.patch<ParentalSettingsRead>(
            '/api/v1/settings/parental',
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },
    getAppearanceSettings: async (): Promise<AppearanceSettingsRead> => {
        const response = await apiClient.get<AppearanceSettingsRead>('/api/v1/settings/appearance');
        return response.data;
    },
    updateAppearanceSettings: async (payload: AppearanceSettingsUpdatePayload): Promise<AppearanceSettingsRead> => {
        const response = await apiClient.patch<AppearanceSettingsRead>(
            '/api/v1/settings/appearance',
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    // --- NEW Symbol API Functions ---
    getStandardCategories: async (): Promise<StandardCategorySymbolMap> => {
        const response = await apiClient.get<StandardCategorySymbolMap>('/api/v1/symbols/standard-categories');
        return response.data || {}; // Return empty object if data is null/undefined
    },
    getCurrentTimeContextSymbols: async (): Promise<TimeContextSymbolsResponse> => {
        const response = await apiClient.get<TimeContextSymbolsResponse>('/api/v1/symbols/current-time-context');
        return response.data || []; // Return empty array if data is null/undefined
    },
    // --- End NEW Symbol API Functions ---

    // Admin - User Management (Condensed for brevity, implement as needed)
    adminCreateUser: async (payload: AdminUserCreatePayload): Promise<UserRead> => apiClient.post<UserRead>('/api/v1/admin/users', payload, { headers: { 'Content-Type': 'application/json' } }).then(res => res.data),
    adminListUsers: async (params?: ListUsersParams): Promise<UserRead[]> => apiClient.get<UserRead[]>('/api/v1/admin/users', { params }).then(res => res.data),
    adminGetUserById: async (userId: string): Promise<UserRead> => { if (!userId) throw new Error("User ID required"); return apiClient.get<UserRead>(`/api/v1/admin/users/${userId}`).then(res => res.data); },
    adminUpdateUserById: async (userId: string, payload: AdminUserUpdatePayload): Promise<UserRead> => { if (!userId) throw new Error("User ID required"); return apiClient.patch<UserRead>(`/api/v1/admin/users/${userId}`, payload, { headers: { 'Content-Type': 'application/json' } }).then(res => res.data); },
    adminDeleteUserById: async (userId: string): Promise<void> => { if (!userId) throw new Error("User ID required"); await apiClient.delete(`/api/v1/admin/users/${userId}`); },

    // Root & Health
    getApiRoot: async (): Promise<any> => apiClient.get('/').then(res => res.data),
    getHealthCheck: async (): Promise<any> => apiClient.get('/health').then(res => res.data),
};
// --- End API Service Object ---


// --- Utility for handling API errors ---
export const handleApiError = (error: unknown): { message: string; details?: ValidationErrorDetail[]; status?: number } => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<HTTPValidationError | string>;
        const status = axiosError.response?.status;

        if (axiosError.response) {
            const data = axiosError.response.data;
            if (typeof data === 'string' && data.length > 0) {
                 return { message: data, status };
            }
            if (data && typeof data === 'object') {
                if ('detail' in data) {
                    const detail = (data as HTTPValidationError).detail;
                    if (Array.isArray(detail)) {
                        const firstError = detail[0];
                        const errorMsg = firstError.msg || 'Validation failed';
                        const errorLoc = firstError.loc ? ` (field: ${firstError.loc.join('.')})` : '';
                        return { message: `Validation Error: ${errorMsg}${errorLoc}`, details: detail, status };
                    } else if (typeof detail === 'string') {
                        return { message: detail, status };
                    }
                }
            }
            return { message: `Error ${status || 'unknown'}: ${axiosError.message || 'An API error occurred.'}`, status };
        } else if (axiosError.request) {
             return { message: `Network Error: No response from server at ${axiosError.config?.baseURL ?? API_BASE_URL}.` };
        }
    } else if (error instanceof Error) {
         return { message: error.message || 'An unexpected error occurred.' };
    }
    return { message: 'An unexpected and unknown error occurred.' };
};

export default apiService;