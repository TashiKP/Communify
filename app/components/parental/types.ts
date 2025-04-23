// src/components/parental/types.ts
export type AsdLevel = 'high' | 'medium' | 'low' | 'noAsd';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ParentalSettingsData {
    blockViolence: boolean;
    blockInappropriate: boolean;
    dailyLimitHours: string;
    asdLevel: AsdLevel | null;
    downtimeEnabled: boolean;
    downtimeDays: DayOfWeek[];
    downtimeStart: string; // HH:MM
    downtimeEnd: string;   // HH:MM
    requirePasscode: boolean;
    notifyEmails: string[]; // <-- ADDED: Array of emails for notifications
}