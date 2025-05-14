// app/services/apiService.ts
import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_BASE_MODEL_URL} from '../config/apiConfig'; 

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
export type GridLayoutType = "simple" | "standard" | "dense"; 
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
    isActive: boolean;
    userType: UserType;
    createdAt: string; 
    updatedAt: string; 
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

// Parental Settings (Frontend CamelCase)
export interface ParentalSettingsData {
    id?: string;
    asdLevel: AsdLevel;
    blockInappropriate: boolean;
    blockViolence: boolean;
    dailyLimitHours: string;
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
    id?: string;
    asd_level: AsdLevel;
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

export interface ParentalSettingsPatchPayload {
    description?: string;
    summary?: string;
    value: Partial<ParentalSettingsApiShape>;
}

// Appearance Settings (Frontend CamelCase)
export interface AppearanceSettingsUpdatePayload {
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

export interface AppearanceSettingsRead {
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
    id?: string;
    brightness?: number;
    contrast_mode?: ContrastModeType;
    dark_mode_enabled?: boolean;
    font_size?: TextSizeType;
    selection_mode?: SelectionModeType;
    symbol_grid_layout?: GridLayoutType;
    tts_highlight_word?: boolean;
    tts_pitch?: number;
    tts_selected_voice_id?: string | null;
    tts_speak_punctuation?: boolean;
    tts_speed?: number;
    tts_volume?: number;
    theme?: string;
}

// Admin
export interface AdminUserCreatePayload extends UserRegisterPayload {
    userType: UserType;
    isActive?: boolean;
}
export interface AdminUserUpdatePayload {
    name?: string;
    age?: number;
    gender?: Gender;
    isActive?: boolean;
    userType?: UserType;
}
export interface ListUsersParams {
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
export interface AudioDataResponse {
    audioBlob: Blob;
    translatedText?: string; // To store the text from the x-translated-text header
    filename?: string;
}
// --- End Types ---


// --- Axios Instance Setup ---
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Accept': 'application/json' },
    timeout: 15000,
});

const modelApiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_MODEL_URL,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 25000,
});

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const noAuthUrls = ['/auth/token', '/auth/register'];
        // Use config.url directly, assuming it's the path relative to baseURL
        let urlPath = config.url || '';

        // Ensure urlPath is relative (strip baseURL if present)
        if (config.baseURL && urlPath.startsWith(config.baseURL)) {
            urlPath = urlPath.replace(config.baseURL, '');
        }
        // Normalize leading slash
        if (!urlPath.startsWith('/')) {
            urlPath = `/${urlPath}`;
        }

        const requiresAuth = !noAuthUrls.some(noAuthUrl => urlPath.endsWith(noAuthUrl));
        if (requiresAuth) {
            const token = await getToken();
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                console.warn(`[ApiService] No token for authenticated request to: ${urlPath}`);
            }
        }

        config.headers = config.headers ?? {};
        if (urlPath.endsWith('/auth/token') && config.method?.toLowerCase() === 'post') {
            config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        } else if (!(config.data instanceof FormData)) {
            if (!config.headers.has('Content-Type')) {
                config.headers.set('Content-Type', 'application/json');
            }
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[ApiService Request Interceptor Error]', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        let urlPath = originalRequest?.url || '';

        // Strip baseURL if present
        if (originalRequest?.baseURL && urlPath.startsWith(originalRequest.baseURL)) {
            urlPath = urlPath.replace(originalRequest.baseURL, '');
        }
        if (!urlPath.startsWith('/')) {
            urlPath = `/${urlPath}`;
        }

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            urlPath &&
            !urlPath.endsWith('/auth/token')
        ) {
            console.warn('[ApiService] 401 Unauthorized. Logging out.');
            originalRequest._retry = true;
            await removeToken();
            return Promise.reject(new Error('SESSION_EXPIRED'));
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
    contrastMode: apiData.contrast_mode || (apiData.theme as ContrastModeType),
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
    theme: apiData.theme,
});

const mapFrontendToApiAppearancePayload = (frontendData: Partial<AppearanceSettingsUpdatePayload>): Partial<AppearanceSettingsApiShape> => {
    const apiData: Partial<AppearanceSettingsApiShape> = {};
    if (frontendData.hasOwnProperty('brightness')) apiData.brightness = frontendData.brightness;
    if (frontendData.hasOwnProperty('contrastMode')) apiData.contrast_mode = frontendData.contrastMode;
    else if (frontendData.hasOwnProperty('theme')) apiData.theme = frontendData.theme;
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
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', email);
        params.append('password', password);
        console.log('[ApiService] Login params:', params.toString());
        const response = await apiClient.post<TokenResponse>('/api/v1/auth/token', params);
        if (response.data.access_token) await storeToken(response.data.access_token);
        else throw new Error('Login successful but no token received.');
        return response.data;
    },
    register: async (payload: UserRegisterPayload): Promise<UserRead> => {
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
    translateText: async (text: string): Promise<TextTranslationResponse> => modelApiClient.post<TextTranslationResponse>('/translate', {text}).then(r=>r.data),
    batchTranslateTexts: async (words: string[], targetLanguage: string): Promise<BatchTranslationResponse> => modelApiClient.post<BatchTranslationResponse>('/batch-translate', {words, target_language:targetLanguage}).then(r=>r.data),
    textToSpeech: async (text: string): Promise<TextToSpeechResponse> => modelApiClient.post<TextToSpeechResponse>('/tts', {text}).then(r=>r.data),
    translateAndTextToSpeech: async (text: string): Promise<AudioDataResponse> => { // Changed return type
        const response: AxiosResponse<Blob> = await modelApiClient.post( // Expect Blob
            '/translate-tts',
            { text },
            { responseType: 'blob' } // Crucial for binary data
        );

        const contentDisposition = response.headers['content-disposition'];
        let filename = 'translated_tts_output.wav'; // Default
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch && filenameMatch.length > 1) {
                filename = filenameMatch[1];
            }
        }

        const translatedTextHeader = response.headers['x-translated-text'];
        let translatedText: string | undefined = undefined;
        if (translatedTextHeader) {
            try {
                translatedText = decodeURIComponent(translatedTextHeader);
            } catch (e) {
                console.warn("Failed to decode x-translated-text header", e);
                translatedText = translatedTextHeader; // Use raw if decode fails
            }
        }

        return {
            audioBlob: response.data,
            filename: filename,
            translatedText: translatedText,
        };
    },
    generateAACPhrase: async (words: string[]): Promise<AACPhraseGenerationResponse> => modelApiClient.post<AACPhraseGenerationResponse>('/generate_aac_phrase', {words}).then(r=>r.data),

    adminCreateUser: async (payload: AdminUserCreatePayload): Promise<UserRead> => {
        const apiPayload = { ...payload, user_type: payload.userType, is_active: payload.isActive === undefined ? true : payload.isActive }; // Default isActive to true
        delete (apiPayload as any).userType; delete (apiPayload as any).isActive;
        const response = await apiClient.post<UserApiResponse>('/api/v1/admin/users', apiPayload);
        return mapApiToFrontendUser(response.data);
    },
    adminListUsers: async (params?: ListUsersParams): Promise<UserRead[]> => {
        const apiParams: any = {};
        if (params) {
            if (params.skip !== undefined) apiParams.skip = params.skip;
            if (params.limit !== undefined) apiParams.limit = params.limit;
            if (params.userType !== undefined && params.userType !== null) apiParams.user_type = params.userType;
            if (params.status !== undefined && params.status !== null) apiParams.status = params.status;
            if (params.emailSearch !== undefined && params.emailSearch !== null) apiParams.email_search = params.emailSearch;
            if (params.nameSearch !== undefined && params.nameSearch !== null) apiParams.name_search = params.nameSearch;
        }
        const response = await apiClient.get<UserApiResponse[]>('/api/v1/admin/users', { params: apiParams });
        return response.data.map(mapApiToFrontendUser);
    },
    adminGetUserById: async (userId: string): Promise<UserRead> => {
        if (!userId) throw new Error("User ID required");
        const response = await apiClient.get<UserApiResponse>(`/api/v1/admin/users/${userId}`);
        return mapApiToFrontendUser(response.data);
    },
    adminUpdateUserById: async (userId: string, payload: AdminUserUpdatePayload): Promise<UserRead> => {
        if (!userId) throw new Error("User ID required");
        const apiPayload: any = { ...payload };
        if (payload.userType !== undefined) { apiPayload.user_type = payload.userType; delete apiPayload.userType; }
        if (payload.isActive !== undefined) { apiPayload.is_active = payload.isActive; delete apiPayload.isActive; }
        const response = await apiClient.patch<UserApiResponse>(`/api/v1/admin/users/${userId}`, apiPayload);
        return mapApiToFrontendUser(response.data);
    },
    adminDeleteUserById: async (userId: string): Promise<void> => { if (!userId) throw new Error("User ID required"); await apiClient.delete(`/api/v1/admin/users/${userId}`); },

    getApiRoot: async (): Promise<any> => apiClient.get('/').then(res => res.data),
    getHealthCheck: async (): Promise<any> => apiClient.get('/health').then(res => res.data),
};
// --- End API Service Object ---


// --- Utility for handling API errors ---
export const handleApiError = (error: unknown): {
    message: string;
    details?: ValidationErrorDetail[];
    status?: number;
    isValidationError?: boolean;
} => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<HTTPValidationError | { detail: string } | string>;
        const status = axiosError.response?.status;

        if (axiosError.response) {
            const data = axiosError.response.data;
            if (status === 422 && data && typeof data === 'object' && 'detail' in data) {
                const errorDetail = (data as HTTPValidationError).detail;
                if (Array.isArray(errorDetail)) {
                    const messages = errorDetail.map(
                        (err) => `${err.msg} (Field: ${err.loc.join(' -> ')})`
                    );
                    return {
                        message: messages.join('; ') || 'Validation error',
                        details: errorDetail,
                        status,
                        isValidationError: true,
                    };
                } else if (typeof errorDetail === 'string') {
                    return { message: errorDetail, status, isValidationError: true };
                }
            }
            if (
                data &&
                typeof data === 'object' &&
                'detail' in data &&
                typeof (data as { detail: string }).detail === 'string'
            ) {
                return { message: (data as { detail: string }).detail, status };
            }
            if (typeof data === 'string' && data.length > 0) {
                return { message: data, status };
            }
            return {
                message: `Error ${status || 'API Response'}: ${axiosError.message || 'An API error occurred.'}`,
                status,
            };
        } else if (axiosError.request) {
            return {
                message: `Network Error: No response received from server. URL: ${axiosError.config?.url || 'unknown'}`,
            };
        }
        return { message: axiosError.message || 'Network or request setup error. Please try again.' };
    } else if (error instanceof Error) {
        return { message: error.message || 'An unexpected application error occurred.' };
    }
    return { message: 'An unexpected and unknown error occurred. Please try again.' };
};


export default apiService;