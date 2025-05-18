// src/components/parental/types.ts

export type AsdLevel = 'low' | 'medium' | 'high' | null;
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// This type should reflect the camelCase version of the API's snake_case keys
export interface ParentalSettingsData {
    id?: string; // Optional, as it's present in GET but not usually sent in PATCH
    asdLevel: AsdLevel;
    blockInappropriate: boolean;
    blockViolence: boolean;
    dailyLimitHours: string; // API sends as string
    // data_sharing_preference is in API response, add if needed, or ignore if not used by frontend
    dataSharingPreference?: boolean; 
    downtimeDays: DayOfWeek[];
    downtimeEnabled: boolean;
    downtimeEnd: string;   // "HH:MM"
    downtimeStart: string; // "HH:MM"
    notifyEmails: string[];
    requirePasscode: boolean;
}

// Type for API response (snake_case)
export interface ParentalSettingsApiResponse {
    id: string;
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