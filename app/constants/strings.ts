// app/constants/strings.ts

// Login Screen
export const LOGIN_TITLE = 'Welcome Back';
export const LOGIN_SUBTITLE = 'Sign in to your account';
export const LOGIN_EMAIL_PLACEHOLDER = 'Email Address';
export const LOGIN_PASSWORD_PLACEHOLDER = 'Password';
export const LOGIN_FORGOT_PASSWORD_TEXT = 'Forgot Password?';
export const LOGIN_SIGN_IN_BUTTON = 'Sign In';
export const LOGIN_NO_ACCOUNT_TEXT = 'New to Communify? ';
export const LOGIN_CREATE_ACCOUNT_LINK = 'Create Account';
export const LOGIN_ERROR_INVALID_CREDENTIALS_FALLBACK = 'Login failed: Invalid response from server.';
export const LOGIN_ERROR_MISSING_FIELDS = 'Please enter both email and password.';

// Communify Brand
export const BRAND_NAME = 'Communify';
export const BRAND_SLOGAN = 'Connect, Share, Inspire';

// Signup Screen
export const SIGNUP_TITLE = 'Create Your Account';
export const SIGNUP_SUBTITLE = 'Fill in the details below to join us.';
export const SIGNUP_FULL_NAME_LABEL = 'Full Name';
export const SIGNUP_FULL_NAME_PLACEHOLDER = 'e.g., John Doe';
export const SIGNUP_AGE_LABEL = 'Age';
export const SIGNUP_AGE_PLACEHOLDER = 'Your Age';
export const SIGNUP_GENDER_LABEL = 'Gender';
export const SIGNUP_EMAIL_LABEL = 'Email Address';
export const SIGNUP_EMAIL_PLACEHOLDER = 'you@example.com';
export const SIGNUP_PASSWORD_LABEL = 'Password';
export const SIGNUP_PASSWORD_PLACEHOLDER = 'Minimum 6 characters';
export const SIGNUP_PROCEED_BUTTON = 'Next Step'; 
export const SIGNUP_ALREADY_HAVE_ACCOUNT = 'Already have an account? ';
export const SIGNUP_LOGIN_LINK = 'Log In';

// Validation Messages
export const VALIDATION_FULL_NAME_REQUIRED = 'Please enter your full name.';
export const VALIDATION_AGE_REQUIRED = 'Please enter your age.';
export const VALIDATION_AGE_INVALID = 'Please enter a valid age.';
export const VALIDATION_GENDER_REQUIRED = 'Please select your gender.';
export const VALIDATION_EMAIL_INVALID = 'Please enter a valid email address.';
export const VALIDATION_PASSWORD_MIN_LENGTH = 'Password must be at least 6 characters long.';

// Alerts
export const ALERT_ACCOUNT_CREATED_TITLE = 'Account Created';
export const ALERT_ACCOUNT_CREATED_MESSAGE = 'Your account has been created successfully.';

// Common
export const GENDER_MALE = 'Male';
export const GENDER_FEMALE = 'Female';
export const GENDER_OTHER = 'Other';

// app/constants/strings.ts

// ... (existing strings for Login, Signup, Validation, etc.)

// SigninTwo Screen (Account Setup Step 2)
export const SIGNIN_TWO_HEADER_TITLE = 'Account Setup'; // Or "Account Setup (Step 2)"
export const SIGNIN_TWO_INTRO_TEXT = 'Personalize your experience. You can change these settings later.';
export const SIGNIN_TWO_PROFILE_SECTION_TITLE = 'Profile';
export const SIGNIN_TWO_DISPLAY_NAME_LABEL = "Display Name"; // If different from "User's Name"
export const SIGNIN_TWO_NAME_PLACEHOLDER = "Enter name";
export const SIGNIN_TWO_AVATAR_HELPER = "Tap the circle to add an avatar.";
export const SIGNIN_TWO_COMMUNICATOR_TYPE_LABEL = "This app is primarily for:";
export const SIGNIN_TWO_COMM_STYLE_LABEL = "Primary Communication Style:";
export const SIGNIN_TWO_GRID_LAYOUT_LABEL = "Preferred Symbol Grid Layout:";
export const SIGNIN_TWO_COMPLETE_BUTTON = "Register Account"; // Or "Complete Setup & Start"
export const SIGNIN_TWO_ERROR_IMAGE_LOAD = "Could not load image.";
export const SIGNIN_TWO_ERROR_NAME_REQUIRED = "Please enter the user's name.";
export const SIGNIN_TWO_ERROR_COMM_TYPE_REQUIRED = "Please select who will use the app."; // If validation is strict
export const SIGNIN_TWO_ERROR_COMM_STYLE_REQUIRED = "Please select the primary communication style."; // If validation is strict
export const SIGNIN_TWO_REGISTRATION_FAILED_FALLBACK = "Failed to complete registration. Please try again.";

// Communicator Options Labels (if you want them as constants)
export const COMM_TYPE_SELF = "Myself";
export const COMM_TYPE_CHILD = "My Child";
export const COMM_TYPE_CLIENT = "Client/Patient"; // Ensure this matches the `type` if used for comparison

// Communication Style Labels
export const COMM_STYLE_EMERGING = "Emerging";
export const COMM_STYLE_CONTEXT = "Context-Dependent";
export const COMM_STYLE_INDEPENDENT = "Independent";
export const COMM_STYLE_LITERATE = "Literate";
// Communication Style Descriptions
export const COMM_STYLE_EMERGING_DESC = "Starting with single symbols, needs significant support.";
export const COMM_STYLE_CONTEXT_DESC = "Uses symbol combinations in familiar situations.";
export const COMM_STYLE_INDEPENDENT_DESC = "Combines symbols creatively across settings.";
export const COMM_STYLE_LITERATE_DESC = "Primarily uses text/keyboard input.";

// Grid Layout Labels
export const GRID_SIMPLE = "Simple";
export const GRID_STANDARD = "Standard";
export const GRID_DENSE = "Dense";

// Alert (already have some from Signup)
export const ALERT_REGISTRATION_SUCCESS_TITLE = "Account Created!"; // If different from Signup
export const ALERT_REGISTRATION_SUCCESS_MESSAGE = "You can now log in with your credentials.";
export const ALERT_GO_TO_LOGIN_BUTTON = "Go to Login";