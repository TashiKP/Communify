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
        // console.log('[ApiService] Token stored successfully.');
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
        // console.log('[ApiService] Token removed successfully.');
    } catch (e) {
        console.error('[ApiService] Failed to remove token:', e);
    }
};
// --- End Token Management ---


// --- Define Enums ---
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type UserType = "parent" | "child" | "admin";
export type UserStatus = "active" | "inactive" | "pending" | "deactivated";
export type AsdLevel = "low" | "medium" | "high" | "noAsd"; // Based on Python enum
export type GridLayoutType = "simple" | "standard" | "dense"; // For Appearance settings
// Add other enums like ContrastModeTypeEnum, TextSizeTypeEnum as needed


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
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
    // avatar_uri is intentionally omitted as per backend model
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

// For PATCH /api/v1/settings/parental
// This is the structure of the 'value' object within the main request body
export interface ParentalSettingsValueUpdate {
    asd_level?: AsdLevel;
    block_inappropriate?: boolean; // Renamed from block_inappropriate_content for consistency with API spec
    block_violence?: boolean;
    daily_limit_hours?: string;
    data_sharing_preference?: boolean;
    downtime_days?: string[]; // e.g., ["Fri", "Sat"]
    downtime_enabled?: boolean;
    downtime_end?: string; // e.g., "07:00"
    downtime_start?: string; // e.g., "21:00"
    notify_emails?: string[];
    require_passcode?: boolean;
    // Add other fields that exist in your backend ParentalSettings model and are updatable
    // user_profile_type?: string; // If you decide to add this for communicatorType
}

// Main payload for PATCH /api/v1/settings/parental
export interface ParentalSettingsUpdatePayload {
    description?: string;
    summary?: string;
    value: Partial<ParentalSettingsValueUpdate>; // The 'value' object contains the actual settings
}

// For GET /api/v1/settings/parental (Response)
export interface ParentalSettingsRead {
    id: string; // Assuming settings docs have an ID
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
    // user_profile_type?: string; // If added
    // Ensure this matches the fields returned by your GET endpoint
}


// For PATCH /api/v1/settings/appearance (Request - directly updates fields)
export interface AppearanceSettingsUpdatePayload {
    brightness?: number;
    contrast_mode?: string; // e.g., "default", "high_contrast"
    dark_mode_enabled?: boolean;
    font_size?: string; // e.g., "medium", "large"
    selection_mode?: string; // e.g., "tap", "drag"
    symbol_grid_layout?: GridLayoutType;
    tts_highlight_word?: boolean;
    tts_pitch?: number;
    tts_selected_voice_id?: string;
    tts_speak_punctuation?: boolean;
    tts_speed?: number;
    tts_volume?: number;
    theme?: string; // e.g., "default", "high-contrast-dark"
}

// For GET /api/v1/settings/appearance (Response)
export interface AppearanceSettingsRead {
    id: string; // Assuming settings docs have an ID
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
    // Ensure this matches the fields returned by your GET endpoint
}


export interface AdminUserCreatePayload extends UserRegisterPayload {
    user_type: UserType;
    is_active?: boolean;
    // phone_number?: string;
    // status?: UserStatus;
}

export interface AdminUserUpdatePayload {
    name?: string;
    age?: number;
    gender?: Gender;
    is_active?: boolean;
    user_type?: UserType;
    // phone_number?: string;
    // status?: UserStatus;
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
// --- End Types ---


// --- Axios Instance Setup ---
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Accept': 'application/json' },
    timeout: 15000,
});

// Request Interceptor
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

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            console.warn('[ApiService] 401 Unauthorized. Logging out.');
            originalRequest._retry = true;
            await removeToken(); // Remove potentially invalid token
            // Here, you'd typically trigger a global state update or navigation to login.
            // For now, just logging. The UI should react to the lack of a token.
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
        // console.log('[ApiService.login] Attempting login for:', email);
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
        // console.log('[ApiService.register] Attempting registration for:', payload.email);
        const response = await apiClient.post<UserRead>('/api/v1/auth/register', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    logout: async (): Promise<void> => {
        await removeToken();
        // console.log('[ApiService] User logged out.');
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
        // Backend expects: { "description": "...", "summary": "...", "value": { setting_fields_here } }
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
        // Backend expects a direct partial update of settings fields
        const response = await apiClient.patch<AppearanceSettingsRead>(
            '/api/v1/settings/appearance',
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    },

    // Admin - User Management
    adminCreateUser: async (payload: AdminUserCreatePayload): Promise<UserRead> => {
        const response = await apiClient.post<UserRead>('/api/v1/admin/users', payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    adminListUsers: async (params?: ListUsersParams): Promise<UserRead[]> => {
        const response = await apiClient.get<UserRead[]>('/api/v1/admin/users', { params });
        return response.data; // Assuming direct array; adjust if API returns paginated object
    },

    adminGetUserById: async (userId: string): Promise<UserRead> => {
        if (!userId) throw new Error("User ID is required for adminGetUserById");
        const response = await apiClient.get<UserRead>(`/api/v1/admin/users/${userId}`);
        return response.data;
    },

    adminUpdateUserById: async (userId: string, payload: AdminUserUpdatePayload): Promise<UserRead> => {
         if (!userId) throw new Error("User ID is required for adminUpdateUserById");
        const response = await apiClient.patch<UserRead>(`/api/v1/admin/users/${userId}`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    adminDeleteUserById: async (userId: string): Promise<void> => {
         if (!userId) throw new Error("User ID is required for adminDeleteUserById");
        await apiClient.delete(`/api/v1/admin/users/${userId}`);
    },

    // Root & Health
    getApiRoot: async (): Promise<any> => {
        const response = await apiClient.get('/');
        return response.data;
    },

    getHealthCheck: async (): Promise<any> => {
        const response = await apiClient.get('/health');
        return response.data;
    },
};
// --- End API Service Object ---


// --- Utility for handling API errors ---
export const handleApiError = (error: unknown): { message: string; details?: ValidationErrorDetail[]; status?: number } => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<HTTPValidationError | string>;
        const status = axiosError.response?.status;
        // console.error(`[handleApiError] Axios Error Status: ${status}`, axiosError.toJSON ? JSON.stringify(axiosError.toJSON(), null, 2) : error);

        if (axiosError.response) {
            const data = axiosError.response.data;
            // console.error('[handleApiError] Response data:', JSON.stringify(data, null, 2));

            if (typeof data === 'string' && data.length > 0) {
                 return { message: data, status };
            }
            if (data && typeof data === 'object') {
                if ('detail' in data) { // Check if data has a 'detail' property
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
            return { message: `Error ${status}: ${axiosError.message || 'An API error occurred.'}`, status };
        } else if (axiosError.request) {
             return { message: `Network Error: No response from server at ${axiosError.config?.baseURL ?? API_BASE_URL}.` };
        }
    } else if (error instanceof Error) {
         return { message: error.message || 'An unexpected error occurred.' };
    }
    return { message: 'An unexpected error occurred.' };
};

export default apiService;