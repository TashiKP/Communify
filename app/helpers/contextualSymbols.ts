// src/helpers/contextualSymbols.ts

export type TimeContext = 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Default';

// Function to determine the current time context
export function getCurrentTimeContext(): TimeContext {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    if (hour >= 21 || hour < 5) return 'Night';
    return 'Default'; // Fallback
}

// Function to get symbols based on time context (or category)
// Increased symbol count for demonstration
export function getContextualSymbols(context: TimeContext): string[] {
    switch (context) {
        case 'Morning':
            return ['good morning', 'breakfast', 'eat', 'drink', 'milk', 'cereal', 'toast', 'brush teeth', 'get dressed', 'school', 'bus', 'play', 'happy', 'sun', 'wake up', 'juice', 'water', 'bathroom', 'wash hands', 'clothes'];
        case 'Afternoon':
            return ['good afternoon', 'lunch', 'eat', 'drink', 'water', 'sandwich', 'play', 'outside', 'park', 'swing', 'slide', 'friends', 'home', 'nap', 'snack', 'book', 'read', 'car', 'walk', 'happy'];
        case 'Evening':
            return ['good evening', 'dinner', 'eat', 'drink', 'water', 'family', 'play', 'bath', 'pajamas', 'book', 'read', 'tired', 'bedtime', 'moon', 'stars', 'television', 'game', 'finished', 'more', 'hungry'];
        case 'Night':
            return ['good night', 'sleep', 'bed', 'tired', 'dark', 'moon', 'stars', 'dream', 'pajamas', 'book', 'mom', 'dad', 'hug', 'kiss', 'quiet', 'light off', 'sleepy', 'blanket', 'pillow', 'finished'];
        case 'Default':
        default:
            return ['hello', 'goodbye', 'yes', 'no', 'please', 'thank you', 'more', 'finished', 'help', 'want', 'eat', 'drink', 'play', 'bathroom', 'hurt', 'sad', 'happy', 'tired', 'mom', 'dad'];
    }
}