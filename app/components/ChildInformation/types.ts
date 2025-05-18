export interface ChildData {
    user: {
        name: string;
        age: number;
        gender: string;
        email: string;
    };
    childProfile: {
        asd_level: string;
        block_inappropriate: boolean;
        block_violence: boolean;
        data_sharing_preference: boolean;
        downtime_enabled: boolean;
        downtime_start: string;
        downtime_end: string;
        require_passcode: boolean;
    };
    appearanceSettings: {
        brightness: number;
        dark_mode_enabled: boolean;
        font_size: string;
        symbol_grid_layout: string;
        tts_highlight_word: boolean;
        tts_pitch: number;
        tts_speed: number;
        tts_volume: number;
    };
}