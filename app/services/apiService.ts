// app/services/apiService.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, API_BASE_MODEL_URL} from '../config/apiConfig';

const ACCESS_TOKEN_KEY = 'communify_access_token';

// --- Token Management ---
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (e) {
    // console.error('[ApiService] Failed to store token:', e); // Keep for dev, remove for prod
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    // console.error('[ApiService] Failed to retrieve token:', e); // Keep for dev, remove for prod
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    // console.error('[ApiService] Failed to remove token:', e); // Keep for dev, remove for prod
  }
};

// --- Enums ---
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type UserType = 'parent' | 'child' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'deactivated';
export type AsdLevel = 'low' | 'medium' | 'high' | 'noAsd' | null;
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type GridLayoutType = 'simple' | 'standard' | 'dense';
export type TextSizeType = 'small' | 'medium' | 'large';
export type ContrastModeType =
  | 'default'
  | 'high-contrast-light'
  | 'high-contrast-dark';
export type SelectionModeType = 'drag' | 'longClick';

// --- API Data Structures (Types/Interfaces) ---
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
  isActive: boolean;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

interface UserApiResponse {
  _id: string; // Expects "_id" from backend JSON
  email: string;
  name: string;
  age?: number;
  gender?: Gender;
  is_active: boolean;
  user_type: UserType; // Expects enum value as string from backend
  created_at: string;
  updated_at: string;
}

export interface UserRegisterPayload {
  email: string;
  name: string;
  password: string;
  age?: number;
  gender?: Gender;
  // userType?: UserType; // If client can specify type on register
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

export interface StandardCategorySymbolMap {
  [categoryName: string]: string[];
}
export type TimeContextSymbolsResponse = string[];
export interface TextTranslationRequest {
  text: string;
}
export interface TextTranslationResponse {
  translated_text: string;
}
export interface BatchTranslationRequest {
  words: string[];
  target_language: string;
}
export interface BatchTranslationResponse {
  translated_words: string[];
}
export interface TextToSpeechRequest {
  text: string;
}
export type TextToSpeechResponse = string; // Assuming base64 audio string or similar
export interface AACPhraseGenerationRequest {
  words: string[];
}
export interface AACPhraseGenerationResponse {
  phrase: string;
}
export interface AudioDataResponse {
  audioBlob: Blob;
  translatedText?: string;
  filename?: string;
}

// --- Axios Instance Setup ---
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {Accept: 'application/json'},
  timeout: 15000,
});

const modelApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_MODEL_URL,
  headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
  timeout: 25000,
});

apiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const noAuthUrls = ['/auth/token', '/auth/register'];
    let urlPath = config.url || '';
    if (config.baseURL && urlPath.startsWith(config.baseURL)) {
      urlPath = urlPath.replace(config.baseURL, '');
    }
    if (!urlPath.startsWith('/')) {
      urlPath = `/${urlPath}`;
    }

    const requiresAuth = !noAuthUrls.some(noAuthUrl =>
      urlPath.endsWith(noAuthUrl),
    );
    if (requiresAuth) {
      const token = await getToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        // console.warn(`[ApiService] No token for authenticated request to: ${urlPath}`); // Dev only
      }
    }

    config.headers = config.headers ?? {};
    if (
      urlPath.endsWith('/auth/token') &&
      config.method?.toLowerCase() === 'post'
    ) {
      config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    } else if (
      !(config.data instanceof FormData) &&
      !config.headers.has('Content-Type')
    ) {
      config.headers.set('Content-Type', 'application/json');
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    let urlPath = originalRequest?.url || '';
    if (
      originalRequest?.baseURL &&
      urlPath.startsWith(originalRequest.baseURL)
    ) {
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
      // console.warn('[ApiService] 401 Unauthorized. Forcing logout.'); // Dev only
      originalRequest._retry = true;
      await removeToken();
      // Consider a more robust way to trigger app-wide logout, e.g., event emitter or state management.
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }
    return Promise.reject(error);
  },
);

// --- Mapping Functions ---
const mapApiToFrontendUser = (apiUser: UserApiResponse): UserRead => ({
  id: apiUser._id, // Map from _id
  email: apiUser.email,
  name: apiUser.name,
  age: apiUser.age,
  gender: apiUser.gender,
  isActive: apiUser.is_active,
  userType: apiUser.user_type,
  createdAt: apiUser.created_at,
  updatedAt: apiUser.updated_at,
});

const mapApiToFrontendParentalSettings = (
  apiData: ParentalSettingsApiShape,
): ParentalSettingsData => ({
  id: apiData.id,
  asdLevel: apiData.asd_level === 'noAsd' ? null : apiData.asd_level,
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

const mapFrontendToApiParentalValues = (
  frontendData: Partial<ParentalSettingsData>,
): Partial<ParentalSettingsApiShape> => {
  const apiData: Partial<ParentalSettingsApiShape> = {};
  if (frontendData.hasOwnProperty('asdLevel'))
    apiData.asd_level =
      frontendData.asdLevel === null ? 'noAsd' : frontendData.asdLevel;
  if (frontendData.hasOwnProperty('blockInappropriate'))
    apiData.block_inappropriate = frontendData.blockInappropriate;
  if (frontendData.hasOwnProperty('blockViolence'))
    apiData.block_violence = frontendData.blockViolence;
  if (frontendData.hasOwnProperty('dailyLimitHours'))
    apiData.daily_limit_hours = frontendData.dailyLimitHours;
  if (frontendData.hasOwnProperty('dataSharingPreference'))
    apiData.data_sharing_preference = frontendData.dataSharingPreference;
  if (frontendData.hasOwnProperty('downtimeDays'))
    apiData.downtime_days = frontendData.downtimeDays;
  if (frontendData.hasOwnProperty('downtimeEnabled'))
    apiData.downtime_enabled = frontendData.downtimeEnabled;
  if (frontendData.hasOwnProperty('downtimeEnd'))
    apiData.downtime_end = frontendData.downtimeEnd;
  if (frontendData.hasOwnProperty('downtimeStart'))
    apiData.downtime_start = frontendData.downtimeStart;
  if (frontendData.hasOwnProperty('notifyEmails'))
    apiData.notify_emails = frontendData.notifyEmails;
  if (frontendData.hasOwnProperty('requirePasscode'))
    apiData.require_passcode = frontendData.requirePasscode;
  return apiData;
};

const mapApiToFrontendAppearanceSettings = (
  apiData: AppearanceSettingsApiShape,
): AppearanceSettingsRead => ({
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

const mapFrontendToApiAppearancePayload = (
  frontendData: Partial<AppearanceSettingsUpdatePayload>,
): Partial<AppearanceSettingsApiShape> => {
  const apiData: Partial<AppearanceSettingsApiShape> = {};
  if (frontendData.hasOwnProperty('brightness'))
    apiData.brightness = frontendData.brightness;
  if (frontendData.hasOwnProperty('contrastMode'))
    apiData.contrast_mode = frontendData.contrastMode;
  else if (frontendData.hasOwnProperty('theme'))
    apiData.theme = frontendData.theme;
  if (frontendData.hasOwnProperty('darkModeEnabled'))
    apiData.dark_mode_enabled = frontendData.darkModeEnabled;
  if (frontendData.hasOwnProperty('fontSize'))
    apiData.font_size = frontendData.fontSize;
  if (frontendData.hasOwnProperty('selectionMode'))
    apiData.selection_mode = frontendData.selectionMode;
  if (frontendData.hasOwnProperty('symbolGridLayout'))
    apiData.symbol_grid_layout = frontendData.symbolGridLayout;
  if (frontendData.hasOwnProperty('ttsHighlightWord'))
    apiData.tts_highlight_word = frontendData.ttsHighlightWord;
  if (frontendData.hasOwnProperty('ttsPitch'))
    apiData.tts_pitch = frontendData.ttsPitch;
  if (frontendData.hasOwnProperty('ttsSelectedVoiceId'))
    apiData.tts_selected_voice_id = frontendData.ttsSelectedVoiceId;
  if (frontendData.hasOwnProperty('ttsSpeakPunctuation'))
    apiData.tts_speak_punctuation = frontendData.ttsSpeakPunctuation;
  if (frontendData.hasOwnProperty('ttsSpeed'))
    apiData.tts_speed = frontendData.ttsSpeed;
  if (frontendData.hasOwnProperty('ttsVolume'))
    apiData.tts_volume = frontendData.ttsVolume;
  return apiData;
};

// --- API Service Object ---
const apiService = {
  storeToken,
  getToken,
  removeToken,

  login: async (email: string, password: string): Promise<TokenResponse> => {
    if (!email || !password)
      throw new Error('Email and password are required.');
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', email);
    params.append('password', password);
    const response = await apiClient.post<TokenResponse>(
      '/api/v1/auth/token',
      params,
    );
    if (response.data.access_token)
      await storeToken(response.data.access_token);
    else throw new Error('Login successful but no token received.');
    return response.data;
  },
  register: async (payload: UserRegisterPayload): Promise<UserRead> => {
    const response = await apiClient.post<UserApiResponse>(
      '/api/v1/auth/register',
      payload,
    );
    return mapApiToFrontendUser(response.data);
  },
  logout: async (): Promise<void> => {
    await removeToken();
  },

  getCurrentUser: async (): Promise<UserRead> => {
    const response = await apiClient.get<UserApiResponse>('/api/v1/users/me');
    return mapApiToFrontendUser(response.data);
  },
  updateCurrentUserProfile: async (
    payload: UserUpdatePayload,
  ): Promise<UserRead> => {
    const response = await apiClient.patch<UserApiResponse>(
      '/api/v1/users/me',
      payload,
    );
    return mapApiToFrontendUser(response.data);
  },
  updateCurrentUserPassword: async (
    payload: UserPasswordUpdatePayload,
  ): Promise<void> => {
    await apiClient.put('/api/v1/users/me/password', payload);
  },
  deactivateCurrentUserAccount: async (): Promise<void> => {
    await apiClient.post('/api/v1/users/me/deactivate');
  },

  sendParentalControlReportEmail: async (
    subject: string,
    body: string,
    recipients: string[],
    eventType: string,
  ): Promise<{success: boolean; message?: string}> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>('/api/v1/parental-controls/report-email', {
        subject,
        body,
        recipients,
        event_type: eventType,
      });
      return {success: response.data.success, message: response.data.message};
    } catch (error) {
      const apiError = handleApiError(error);
      return {
        success: false,
        message: apiError.message || 'Failed to send report email via server.',
      };
    }
  },

  verifyParentalPasscode: async (
    passcode: string,
  ): Promise<{isCorrect: boolean; message?: string}> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>('/api/v1/auth/verify-parental-passcode', {passcode});
      return {isCorrect: response.data.success, message: response.data.message};
    } catch (error) {
      return {
        isCorrect: false,
        message:
          handleApiError(error).message ||
          'Verification failed due to a server error.',
      };
    }
  },
  checkBackendHasParentalPasscode: async (): Promise<{
    exists: boolean;
    message?: string;
  }> => {
    try {
      const response = await apiClient.get<{passcode_is_set: boolean}>(
        '/api/v1/auth/has-parental-passcode',
      );
      return {exists: response.data.passcode_is_set};
    } catch (error) {
      return {
        exists: false,
        message: 'Could not determine passcode status from server.',
      };
    }
  },
  setOrUpdateParentalPasscodeOnBackend: async (
    newPasscode: string,
    currentPasscode?: string,
  ): Promise<{success: boolean; message?: string}> => {
    try {
      const payload: {new_passcode: string; current_passcode?: string} = {
        new_passcode: newPasscode,
      };
      if (currentPasscode) payload.current_passcode = currentPasscode;
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>('/api/v1/auth/set-parental-passcode', payload);
      return {success: response.data.success, message: response.data.message};
    } catch (error) {
      return {
        success: false,
        message:
          handleApiError(error).message || 'Failed to set passcode on server.',
      };
    }
  },
  removeParentalPasscodeOnBackend: async (
    currentPasscodeValue: string,
  ): Promise<{success: boolean; message?: string}> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>('/api/v1/auth/remove-parental-passcode', {
        current_passcode: currentPasscodeValue,
      });
      return {success: response.data.success, message: response.data.message};
    } catch (error) {
      return {
        success: false,
        message:
          handleApiError(error).message ||
          'Failed to remove passcode on server.',
      };
    }
  },

  fetchParentalSettings: async (): Promise<ParentalSettingsData> => {
    const response = await apiClient.get<ParentalSettingsApiShape>(
      '/api/v1/settings/parental',
    );
    return mapApiToFrontendParentalSettings(response.data);
  },
  saveParentalSettings: async (
    settingsToSave: Partial<ParentalSettingsData>,
  ): Promise<ParentalSettingsData> => {
    const apiValues = mapFrontendToApiParentalValues(settingsToSave);
    const payload: ParentalSettingsPatchPayload = {value: apiValues};
    const response = await apiClient.patch<ParentalSettingsApiShape>(
      '/api/v1/settings/parental',
      payload,
    );
    return mapApiToFrontendParentalSettings(response.data);
  },
  fetchAppearanceSettings: async (): Promise<AppearanceSettingsRead> => {
    const response = await apiClient.get<AppearanceSettingsApiShape>(
      '/api/v1/settings/appearance',
    );
    return mapApiToFrontendAppearanceSettings(response.data);
  },
  saveAppearanceSettings: async (
    payload: Partial<AppearanceSettingsUpdatePayload>,
  ): Promise<AppearanceSettingsRead> => {
    const apiPayload = mapFrontendToApiAppearancePayload(payload);
    const response = await apiClient.patch<AppearanceSettingsApiShape>(
      '/api/v1/settings/appearance',
      apiPayload,
    );
    return mapApiToFrontendAppearanceSettings(response.data);
  },

  getStandardCategories: async (): Promise<StandardCategorySymbolMap> =>
    apiClient
      .get<StandardCategorySymbolMap>('/api/v1/symbols/standard-categories')
      .then(res => res.data || {}),
  getCurrentTimeContextSymbols: async (): Promise<TimeContextSymbolsResponse> =>
    apiClient
      .get<TimeContextSymbolsResponse>('/api/v1/symbols/current-time-context')
      .then(res => res.data || []),

  translateText: async (text: string): Promise<TextTranslationResponse> =>
    modelApiClient
      .post<TextTranslationResponse>('/translate', {text})
      .then(r => r.data),
  batchTranslateTexts: async (
    words: string[],
    targetLanguage: string,
  ): Promise<BatchTranslationResponse> =>
    modelApiClient
      .post<BatchTranslationResponse>('/batch-translate', {
        words,
        target_language: targetLanguage,
      })
      .then(r => r.data),
  textToSpeech: async (text: string): Promise<TextToSpeechResponse> =>
    modelApiClient.post<TextToSpeechResponse>('/tts', {text}).then(r => r.data),
  translateAndTextToSpeech: async (
    text: string,
  ): Promise<AudioDataResponse> => {
    const response: AxiosResponse<Blob> = await modelApiClient.post(
      '/translate-tts',
      {text},
      {responseType: 'blob'},
    );
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'translated_tts_output.wav';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch?.[1]) filename = filenameMatch[1];
    }
    let translatedText: string | undefined = undefined;
    const translatedTextHeader = response.headers['x-translated-text'];
    if (translatedTextHeader) {
      try {
        translatedText = decodeURIComponent(translatedTextHeader);
      } catch (e) {
        translatedText = translatedTextHeader;
      }
    }
    return {audioBlob: response.data, filename, translatedText};
  },
  generateAACPhrase: async (
    words: string[],
  ): Promise<AACPhraseGenerationResponse> =>
    modelApiClient
      .post<AACPhraseGenerationResponse>('/generate_aac_phrase', {words})
      .then(r => r.data),

  adminCreateUser: async (
    payload: AdminUserCreatePayload,
  ): Promise<UserRead> => {
    const apiPayload = {
      ...payload,
      user_type: payload.userType,
      is_active: payload.isActive === undefined ? true : payload.isActive,
    };
    delete (apiPayload as any).userType;
    delete (apiPayload as any).isActive;
    const response = await apiClient.post<UserApiResponse>(
      '/api/v1/admin/users',
      apiPayload,
    );
    return mapApiToFrontendUser(response.data);
  },
  adminListUsers: async (params?: ListUsersParams): Promise<UserRead[]> => {
    const response = await apiClient.get<UserApiResponse[]>(
      '/api/v1/admin/users',
      {params},
    );
    return response.data.map(mapApiToFrontendUser);
  },
  adminGetUserById: async (userId: string): Promise<UserRead> => {
    if (!userId) throw new Error('User ID required');
    const response = await apiClient.get<UserApiResponse>(
      `/api/v1/admin/users/${userId}`,
    );
    return mapApiToFrontendUser(response.data);
  },
  adminUpdateUserById: async (
    userId: string,
    payload: AdminUserUpdatePayload,
  ): Promise<UserRead> => {
    if (!userId) throw new Error('User ID required');
    const apiPayload: any = {...payload};
    if (payload.userType !== undefined) {
      apiPayload.user_type = payload.userType;
      delete apiPayload.userType;
    }
    if (payload.isActive !== undefined) {
      apiPayload.is_active = payload.isActive;
      delete apiPayload.isActive;
    }
    const response = await apiClient.patch<UserApiResponse>(
      `/api/v1/admin/users/${userId}`,
      apiPayload,
    );
    return mapApiToFrontendUser(response.data);
  },
  adminDeleteUserById: async (userId: string): Promise<void> => {
    if (!userId) throw new Error('User ID required');
    await apiClient.delete(`/api/v1/admin/users/${userId}`);
  },

  getApiRoot: async (): Promise<any> =>
    apiClient.get('/').then(res => res.data),
  getHealthCheck: async (): Promise<any> =>
    apiClient.get('/health').then(res => res.data),
};

// --- Utility for handling API errors ---
export const handleApiError = (
  error: unknown,
): {
  message: string;
  details?: ValidationErrorDetail[];
  status?: number;
  isValidationError?: boolean;
} => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<
      HTTPValidationError | {detail: string} | string
    >;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    if (responseData) {
      if (
        status === 422 &&
        typeof responseData === 'object' &&
        responseData !== null &&
        'detail' in responseData
      ) {
        const errorDetail = (responseData as HTTPValidationError).detail;
        if (Array.isArray(errorDetail)) {
          const messages = errorDetail.map(
            err => `${err.msg} (Field: ${err.loc.join('->')})`,
          );
          return {
            message: messages.join('; ') || 'Validation error',
            details: errorDetail,
            status,
            isValidationError: true,
          };
        } else if (typeof errorDetail === 'string') {
          return {message: errorDetail, status, isValidationError: true};
        }
      }
      if (
        typeof responseData === 'object' &&
        responseData !== null &&
        'detail' in responseData &&
        typeof (responseData as {detail: string}).detail === 'string'
      ) {
        return {message: (responseData as {detail: string}).detail, status};
      }
      if (typeof responseData === 'string' && responseData.length > 0) {
        return {message: responseData, status};
      }
    }
    if (axiosError.request && !axiosError.response) {
      return {
        message: 'Network Error: No response from server. Check connectivity.',
      };
    }
    return {
      message: axiosError.message || `API Error: ${status || 'Unknown status'}`,
      status,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected application error occurred.',
    };
  }
  return {message: 'An unknown error occurred.'};
};

export default apiService;
