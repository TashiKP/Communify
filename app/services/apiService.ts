// app/services/apiService.ts
import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_BASE_MODEL_URL} from '../config/apiConfig'; // Ensure this path is correct

const ACCESS_TOKEN_KEY = 'communify_access_token';

// --- Token Management ---
export const storeToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
        console.error('[ApiService] Failed to store token:', e);
    }
};

export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('[ApiService] Failed to retrieve token:', e);
        return null;
    }
};

export const removeToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('[ApiService] Failed to remove token:', e);
    }
};
// --- End Token Management ---


// --- Define Enums (as used by frontend and for mapping to/from API) ---
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type UserType = "parent" | "child" | "admin";
export type UserStatus = "active" | "inactive" | "pending" | "deactivated";
export type AsdLevel = "low" | "medium" | "high" | "noAsd" | null;
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type GridLayoutType = "simple" | "standard" | "dense"; // Frontend/Context type
// Types for Appearance settings if they come from context or are used directly by frontend
export type TextSizeType = "small" | "medium" | "large";
export type ContrastModeType = "default" | "high-contrast-light" | "high-contrast-dark";
export type SelectionModeType = "drag" | "longClick";


// --- Define API Data Structures (Types/Interfaces) ---

// Authentication & User
export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserRead { // Frontend representation (camelCase)
    id: string;
    email: string;
    name: string;
    age?: number;
    gender?: Gender;
    isActive: boolean; // Mapped from is_active
    userType: UserType; // Mapped from user_type
    createdAt: string; // Mapped from created_at
    updatedAt: string; // Mapped from updated_at
}

// Raw API response for User (snake_case)
interface UserApiResponse {
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

export interface UserRegisterPayload { // Sent to API (snake_case or auto-mapped by FastAPI if Pydantic model uses aliases)
    email: string;                  // For this example, let's assume frontend sends camelCase and we map if needed
    name: string;                   // or FastAPI handles camelCase to snake_case if model has aliases.
    password: string;               // For simplicity, this payload will be camelCase, matching frontend state.
    age?: number;                   // FastAPI will validate against its UserCreate Pydantic schema.
    gender?: Gender;
}

export interface UserUpdatePayload { // Frontend camelCase
    name?: string;
    age?: number;
    gender?: Gender;
}

export interface UserPasswordUpdatePayload { // Sent to API (snake_case)
    current_password: string;
    new_password: string;
}

// Parental Settings (Frontend CamelCase)
export interface ParentalSettingsData {
    id?: string;
    asdLevel: AsdLevel;
    blockInappropriate: boolean;
    blockViolence: boolean;
    dailyLimitHours: string; // Keep as string to match API expectation if it's flexible
    dataSharingPreference?: boolean;
    downtimeDays: DayOfWeek[];
    downtimeEnabled: boolean;
    downtimeEnd: string;
    downtimeStart: string;
    notifyEmails: string[];
    requirePasscode: boolean;
}

// Parental Settings (API Snake_case for GET response and PATCH value items)
interface ParentalSettingsApiShape {
    id?: string; // id is in GET response
    asd_level: AsdLevel; // API might use "noAsd" string or null
    block_inappropriate: boolean;
    block_violence: boolean;
    daily_limit_hours: string;
    data_sharing_preference?: boolean;
    downtime_days: DayOfWeek[];
    downtime_enabled: boolean;
    downtime_end: string;
    downtime_start: string;
    notify_emails: string[];
    require_passcode: boolean;
}

// Full PATCH payload for Parental Settings
export interface ParentalSettingsPatchPayload {
    description?: string;
    summary?: string;
    value: Partial<ParentalSettingsApiShape>; // Values here should be snake_case
}

// Appearance Settings (Frontend CamelCase)
export interface AppearanceSettingsUpdatePayload { // For frontend to build the PATCH request values
    brightness?: number;
    contrastMode?: ContrastModeType;
    darkModeEnabled?: boolean;
    fontSize?: TextSizeType;
    selectionMode?: SelectionModeType;
    symbolGridLayout?: GridLayoutType;
    ttsHighlightWord?: boolean;
    ttsPitch?: number;
    ttsSelectedVoiceId?: string | null; // Allow null for explicit clearing
    ttsSpeakPunctuation?: boolean;
    ttsSpeed?: number;
    ttsVolume?: number;
    theme?: string; // Alternative for contrastMode if API uses 'theme'
}

export interface AppearanceSettingsRead { // For frontend to consume GET response
    id: string;
    brightness?: number;
    contrastMode?: ContrastModeType;
    darkModeEnabled?: boolean;
    fontSize?: TextSizeType;
    selectionMode?: SelectionModeType;
    symbolGridLayout?: GridLayoutType;
    ttsHighlightWord?: boolean;
    ttsPitch?: number;
    ttsSelectedVoiceId?: string | null;
    ttsSpeakPunctuation?: boolean;
    ttsSpeed?: number;
    ttsVolume?: number;
    theme?: string;
}

// Appearance Settings (API Snake_case for GET response and PATCH value items)
interface AppearanceSettingsApiShape {
    id?: string; // id is in GET response
    brightness?: number;
    contrast_mode?: ContrastModeType;
    dark_mode_enabled?: boolean;
    font_size?: TextSizeType;
    selection_mode?: SelectionModeType;
    symbol_grid_layout?: GridLayoutType; // Ensure this matches backend enum value if it's an enum there
    tts_highlight_word?: boolean;
    tts_pitch?: number;
    tts_selected_voice_id?: string | null;
    tts_speak_punctuation?: boolean;
    tts_speed?: number;
    tts_volume?: number;
    theme?: string; // Alias for contrast_mode on API side perhaps
}

// Admin
export interface AdminUserCreatePayload extends UserRegisterPayload { // Extends camelCase payload
    userType: UserType; // user_type in API
    isActive?: boolean; // is_active in API
}
export interface AdminUserUpdatePayload { // camelCase
    name?: string;
    age?: number;
    gender?: Gender;
    isActive?: boolean;
    userType?: UserType;
}
export interface ListUsersParams { // camelCase for frontend params
    skip?: number;
    limit?: number;
    userType?: UserType | null;
    status?: UserStatus | null;
    emailSearch?: string | null;
    nameSearch?: string | null;
}

// Error Structures
export interface ValidationErrorDetail { loc: (string | number)[]; msg: string; type: string; input?: any; ctx?: Record<string, any>; }
export interface HTTPValidationError { detail: ValidationErrorDetail[] | string; }

// Symbol API Types
export interface StandardCategorySymbolMap { [categoryName: string]: string[]; }
export type TimeContextSymbolsResponse = string[];

export interface TextTranslationRequest { text: string; }
export interface TextTranslationResponse { translated_text: string; }
export interface BatchTranslationRequest { words: string[]; target_language: string; }
export interface BatchTranslationResponse { translated_words: string[]; }
export interface TextToSpeechRequest { text: string; }
export type TextToSpeechResponse = string;
export type TranslateAndTTsResponse = string;
export interface AACPhraseGenerationRequest { words: string[]; }
export interface AACPhraseGenerationResponse { phrase: string; }
// --- End Types ---


// --- Axios Instance Setup ---
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, // Default Content-Type
    timeout: 15000,
});

const modelApiClient: AxiosInstance = axios.create({ // For Multimodal AI API
    baseURL: API_BASE_MODEL_URL,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 25000, // Models might take longer
}); 

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const noAuthUrls = ['/auth/token', '/auth/register'];
        const urlPath = config.url ? new URL(config.url, config.baseURL).pathname : '';
        const requiresAuth = !noAuthUrls.some(noAuthUrl => urlPath.endsWith(noAuthUrl));

        if (requiresAuth) {
            const token = await getToken();
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                console.warn(`[ApiService] No token for authenticated request: ${urlPath}`);
            }
        }
        // Special case for login (x-www-form-urlencoded)
        if (urlPath.endsWith('/auth/token') && config.method === 'post') {
            config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        } else {
            config.headers.set('Content-Type', 'application/json');
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const urlPath = originalRequest.url ? new URL(originalRequest.url, originalRequest.baseURL).pathname : '';
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !urlPath.endsWith('/auth/token')) {
            console.warn('[ApiService] 401 Unauthorized. Logging out.');
            originalRequest._retry = true;
            await removeToken(); // Clear stale token
            // TODO: Implement global navigation or state update to redirect to login.
            // Example: eventEmitter.emit('logout'); or navigationService.navigate('Login');
            // For now, just rejecting with a specific error that UI can catch
            return Promise.reject(new Error("SESSION_EXPIRED"));
        }
        return Promise.reject(error);
    }
);
// --- End Axios Interceptors ---

// --- Mapping Functions ---
const mapApiToFrontendUser = (apiUser: UserApiResponse): UserRead => ({
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    age: apiUser.age,
    gender: apiUser.gender,
    isActive: apiUser.is_active,
    userType: apiUser.user_type,
    createdAt: apiUser.created_at,
    updatedAt: apiUser.updated_at,
});

const mapApiToFrontendParentalSettings = (apiData: ParentalSettingsApiShape): ParentalSettingsData => ({
    id: apiData.id,
    asdLevel: apiData.asd_level === "noAsd" ? null : apiData.asd_level,
    blockInappropriate: apiData.block_inappropriate,
    blockViolence: apiData.block_violence,
    dailyLimitHours: apiData.daily_limit_hours,
    dataSharingPreference: apiData.data_sharing_preference,
    downtimeDays: apiData.downtime_days || [],
    downtimeEnabled: apiData.downtime_enabled,
    downtimeEnd: apiData.downtime_end,
    downtimeStart: apiData.downtime_start,
    notifyEmails: apiData.notify_emails || [],
    requirePasscode: apiData.require_passcode,
});

const mapFrontendToApiParentalValues = (frontendData: Partial<ParentalSettingsData>): Partial<ParentalSettingsApiShape> => {
    const apiData: Partial<ParentalSettingsApiShape> = {};
    // Only include fields if they are explicitly present in frontendData (even if null)
    if (frontendData.hasOwnProperty('asdLevel')) apiData.asd_level = frontendData.asdLevel === null ? "noAsd" : frontendData.asdLevel;
    if (frontendData.hasOwnProperty('blockInappropriate')) apiData.block_inappropriate = frontendData.blockInappropriate;
    if (frontendData.hasOwnProperty('blockViolence')) apiData.block_violence = frontendData.blockViolence;
    if (frontendData.hasOwnProperty('dailyLimitHours')) apiData.daily_limit_hours = frontendData.dailyLimitHours;
    if (frontendData.hasOwnProperty('dataSharingPreference')) apiData.data_sharing_preference = frontendData.dataSharingPreference;
    if (frontendData.hasOwnProperty('downtimeDays')) apiData.downtime_days = frontendData.downtimeDays;
    if (frontendData.hasOwnProperty('downtimeEnabled')) apiData.downtime_enabled = frontendData.downtimeEnabled;
    if (frontendData.hasOwnProperty('downtimeEnd')) apiData.downtime_end = frontendData.downtimeEnd;
    if (frontendData.hasOwnProperty('downtimeStart')) apiData.downtime_start = frontendData.downtimeStart;
    if (frontendData.hasOwnProperty('notifyEmails')) apiData.notify_emails = frontendData.notifyEmails;
    if (frontendData.hasOwnProperty('requirePasscode')) apiData.require_passcode = frontendData.requirePasscode;
    return apiData;
};

const mapApiToFrontendAppearanceSettings = (apiData: AppearanceSettingsApiShape): AppearanceSettingsRead => ({
    id: apiData.id!,
    brightness: apiData.brightness,
    contrastMode: apiData.contrast_mode || (apiData.theme as ContrastModeType), // Prioritize contrast_mode
    darkModeEnabled: apiData.dark_mode_enabled,
    fontSize: apiData.font_size as TextSizeType,
    selectionMode: apiData.selection_mode as SelectionModeType,
    symbolGridLayout: apiData.symbol_grid_layout,
    ttsHighlightWord: apiData.tts_highlight_word,
    ttsPitch: apiData.tts_pitch,
    ttsSelectedVoiceId: apiData.tts_selected_voice_id,
    ttsSpeakPunctuation: apiData.tts_speak_punctuation,
    ttsSpeed: apiData.tts_speed,
    ttsVolume: apiData.tts_volume,
    theme: apiData.theme, // Keep original theme if distinct
});

const mapFrontendToApiAppearancePayload = (frontendData: Partial<AppearanceSettingsUpdatePayload>): Partial<AppearanceSettingsApiShape> => {
    const apiData: Partial<AppearanceSettingsApiShape> = {};
    if (frontendData.hasOwnProperty('brightness')) apiData.brightness = frontendData.brightness;
    if (frontendData.hasOwnProperty('contrastMode')) apiData.contrast_mode = frontendData.contrastMode;
    else if (frontendData.hasOwnProperty('theme')) apiData.theme = frontendData.theme; // If theme is used as alternative
    if (frontendData.hasOwnProperty('darkModeEnabled')) apiData.dark_mode_enabled = frontendData.darkModeEnabled;
    if (frontendData.hasOwnProperty('fontSize')) apiData.font_size = frontendData.fontSize;
    if (frontendData.hasOwnProperty('selectionMode')) apiData.selection_mode = frontendData.selectionMode;
    if (frontendData.hasOwnProperty('symbolGridLayout')) apiData.symbol_grid_layout = frontendData.symbolGridLayout;
    if (frontendData.hasOwnProperty('ttsHighlightWord')) apiData.tts_highlight_word = frontendData.ttsHighlightWord;
    if (frontendData.hasOwnProperty('ttsPitch')) apiData.tts_pitch = frontendData.ttsPitch;
    if (frontendData.hasOwnProperty('ttsSelectedVoiceId')) apiData.tts_selected_voice_id = frontendData.ttsSelectedVoiceId;
    if (frontendData.hasOwnProperty('ttsSpeakPunctuation')) apiData.tts_speak_punctuation = frontendData.ttsSpeakPunctuation;
    if (frontendData.hasOwnProperty('ttsSpeed')) apiData.tts_speed = frontendData.ttsSpeed;
    if (frontendData.hasOwnProperty('ttsVolume')) apiData.tts_volume = frontendData.ttsVolume;
    return apiData;
};
// --- End Mapping Functions ---


// --- API Service Object ---
const apiService = {
    storeToken, getToken, removeToken,

    login: async (email: string, password: string): Promise<TokenResponse> => {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', email);
        params.append('password', password);
        const response = await apiClient.post<TokenResponse>('/api/v1/auth/token', params); // Content-Type set by interceptor
        if (response.data.access_token) await storeToken(response.data.access_token);
        else throw new Error('Login successful but no token received.');
        return response.data;
    },
    register: async (payload: UserRegisterPayload): Promise<UserRead> => {
        // Assuming FastAPI handles mapping camelCase payload to snake_case model if aliases are set
        const response = await apiClient.post<UserApiResponse>('/api/v1/auth/register', payload);
        return mapApiToFrontendUser(response.data);
    },
    logout: async (): Promise<void> => {
        await removeToken();
        // Optionally call backend logout: await apiClient.post('/api/v1/auth/logout');
        console.log('[ApiService] User logged out.');
    },

    getCurrentUser: async (): Promise<UserRead> => {
        const response = await apiClient.get<UserApiResponse>('/api/v1/users/me');
        return mapApiToFrontendUser(response.data);
    },
    updateCurrentUserProfile: async (payload: UserUpdatePayload): Promise<UserRead> => {
        const response = await apiClient.patch<UserApiResponse>('/api/v1/users/me', payload);
        return mapApiToFrontendUser(response.data);
    },
    updateCurrentUserPassword: async (payload: UserPasswordUpdatePayload): Promise<void> => {
        await apiClient.put('/api/v1/users/me/password', payload);
    },
    deactivateCurrentUserAccount: async (): Promise<void> => {
        await apiClient.post('/api/v1/users/me/deactivate');
    },
    verifyParentalPasscode: async (passcode: string): Promise<{ isCorrect: boolean; message?: string }> => {
        try {
            const response = await apiClient.post<{ success: boolean; message?: string }>('/api/v1/auth/verify-parental-passcode', { passcode });
            return { isCorrect: response.data.success, message: response.data.message };
        } catch (error) {
            const apiError = handleApiError(error);
            return { isCorrect: false, message: apiError.message || 'Verification failed due to a server error.' };
        }
    },

    fetchParentalSettings: async (): Promise<ParentalSettingsData> => {
        const response = await apiClient.get<ParentalSettingsApiShape>('/api/v1/settings/parental');
        return mapApiToFrontendParentalSettings(response.data);
    },
    saveParentalSettings: async (settingsToSave: Partial<ParentalSettingsData>): Promise<ParentalSettingsData> => {
        const apiValues = mapFrontendToApiParentalValues(settingsToSave);
        const payload: ParentalSettingsPatchPayload = { value: apiValues };
        const response = await apiClient.patch<ParentalSettingsApiShape>('/api/v1/settings/parental', payload);
        return mapApiToFrontendParentalSettings(response.data);
    },
    fetchAppearanceSettings: async (): Promise<AppearanceSettingsRead> => {
        const response = await apiClient.get<AppearanceSettingsApiShape>('/api/v1/settings/appearance');
        return mapApiToFrontendAppearanceSettings(response.data);
    },
    saveAppearanceSettings: async (payload: Partial<AppearanceSettingsUpdatePayload>): Promise<AppearanceSettingsRead> => {
        const apiPayload = mapFrontendToApiAppearancePayload(payload);
        const response = await apiClient.patch<AppearanceSettingsApiShape>('/api/v1/settings/appearance', apiPayload);
        return mapApiToFrontendAppearanceSettings(response.data);
    },

    getStandardCategories: async (): Promise<StandardCategorySymbolMap> => apiClient.get<StandardCategorySymbolMap>('/api/v1/symbols/standard-categories').then(res => res.data || {}),
    getCurrentTimeContextSymbols: async (): Promise<TimeContextSymbolsResponse> => apiClient.get<TimeContextSymbolsResponse>('/api/v1/symbols/current-time-context').then(res => res.data || []),

    // --- NEW Multimodal AI Endpoints (using modelApiClient) ---
    translateText: async (text: any) => modelApiClient.post<TextTranslationResponse>('/translate', {text}).then(r=>r.data),
    batchTranslateTexts: async (words: any, targetLanguage: any) => modelApiClient.post<BatchTranslationResponse>('/batch-translate', {words, target_language:targetLanguage}).then(r=>r.data),
    textToSpeech: async (text: any) => modelApiClient.post<TextToSpeechResponse>('/tts', {text}).then(r=>r.data),
    translateAndTextToSpeech: async (text: any) => modelApiClient.post<TranslateAndTTsResponse>('/translate-tts', {text}).then(r=>r.data),
    generateAACPhrase: async (words: any) => modelApiClient.post<AACPhraseGenerationResponse>('/generate_aac_phrase', {words}).then(r=>r.data),

    adminCreateUser: async (payload: AdminUserCreatePayload): Promise<UserRead> => {
        // Map payload if frontend AdminUserCreatePayload is camelCase and API expects snake_case
        const apiPayload = { ...payload, user_type: payload.userType, is_active: payload.isActive };
        delete (apiPayload as any).userType; delete (apiPayload as any).isActive;
        const response = await apiClient.post<UserApiResponse>('/api/v1/admin/users', apiPayload);
        return mapApiToFrontendUser(response.data);
    },
    adminListUsers: async (params?: ListUsersParams): Promise<UserRead[]> => {
        // Map params if needed (e.g., emailSearch to email_search)
        const response = await apiClient.get<UserApiResponse[]>('/api/v1/admin/users', { params });
        return response.data.map(mapApiToFrontendUser);
    },
    adminGetUserById: async (userId: string): Promise<UserRead> => {
        if (!userId) throw new Error("User ID required");
        const response = await apiClient.get<UserApiResponse>(`/api/v1/admin/users/${userId}`);
        return mapApiToFrontendUser(response.data);
    },
    adminUpdateUserById: async (userId: string, payload: AdminUserUpdatePayload): Promise<UserRead> => {
        if (!userId) throw new Error("User ID required");
        // Map payload if needed
        const apiPayload = { ...payload, user_type: payload.userType, is_active: payload.isActive };
        delete (apiPayload as any).userType; delete (apiPayload as any).isActive;
        const response = await apiClient.patch<UserApiResponse>(`/api/v1/admin/users/${userId}`, apiPayload);
        return mapApiToFrontendUser(response.data);
    },
    adminDeleteUserById: async (userId: string): Promise<void> => { if (!userId) throw new Error("User ID required"); await apiClient.delete(`/api/v1/admin/users/${userId}`); },

    getApiRoot: async (): Promise<any> => apiClient.get('/').then(res => res.data),
    getHealthCheck: async (): Promise<any> => apiClient.get('/health').then(res => res.data),
};
// --- End API Service Object ---


// --- Utility for handling API errors ---
// app/services/apiService.ts
// ... (all other code: imports, token management, enums, types, Axios instances, interceptors, mapping functions, apiService object)

export const handleApiError = (error: unknown): {
    message: string;
    details?: ValidationErrorDetail[];
    status?: number;
    isValidationError?: boolean;
} => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<HTTPValidationError | { detail: string } | string >;
        const status = axiosError.response?.status;
        const config = axiosError.config; // Get config from the error object

        if (axiosError.response) {
            // Server responded with a status code that falls out of the range of 2xx
            const data = axiosError.response.data;
            if (status === 422 && data && typeof data === 'object' && 'detail' in data) {
                const errorDetail = (data as HTTPValidationError).detail;
                if (Array.isArray(errorDetail)) {
                    const firstError = errorDetail[0];
                    if (firstError && typeof firstError === 'object' && 'msg' in firstError && 'loc' in firstError) {
                        const errorMsg = firstError.msg || 'Validation error';
                        const errorLoc = firstError.loc ? ` (Field: ${firstError.loc.join(' -> ')})` : '';
                        return { message: `${errorMsg}${errorLoc}`, details: errorDetail, status, isValidationError: true };
                    } else {
                        return { message: 'Invalid validation error format received from API.', status, isValidationError: true };
                    }
                } else if (typeof errorDetail === 'string') {
                    return { message: errorDetail, status, isValidationError: true };
                }
            }
            if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail: string }).detail === 'string') {
                return { message: (data as { detail: string }).detail, status };
            }
            if (typeof data === 'string' && data.length > 0) {
                return { message: data, status };
            }
            return { message: `Error ${status || 'API Response'}: ${axiosError.message || 'An API error occurred.'}`, status };
        } else if (axiosError.request) {
            // The request was made but no response was received
            let requestInfo = "Request details unavailable.";
            // --- MODIFIED BLOCK for more robust config checking ---
            if (config && typeof config.url === 'string') { // Check config and config.url
                const method = config.method ? config.method.toUpperCase() : 'UNKNOWN_METHOD';
                requestInfo = `URL: ${method} ${config.url}`;
            } else if (config) { // Config exists but URL might be missing
                 const method = config.method ? config.method.toUpperCase() : 'UNKNOWN_METHOD';
                 requestInfo = `Method: ${method}, URL not available in error config.`;
            }
            // --- END MODIFIED BLOCK ---
            return { message: `Network Error: No response received from server. ${requestInfo}. Please check your connection.` };
        }
        // Something else happened in setting up the request that triggered an Error
        return { message: axiosError.message || "Network or request setup error. Please try again." };

    } else if (error instanceof Error) {
        // Standard JavaScript error
        return { message: error.message || 'An unexpected application error occurred.' };
    }
    // Fallback for truly unknown errors
    return { message: 'An unexpected and unknown error occurred. Please try again.' };
};


export default apiService;