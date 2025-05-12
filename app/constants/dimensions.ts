// app/constants/dimensions.ts

// Spacing & Padding
export const SCREEN_PADDING_HORIZONTAL = 25;
export const SCREEN_PADDING_VERTICAL = 30;
export const INPUT_GROUP_MARGIN_BOTTOM = 22;
export const LABEL_MARGIN_BOTTOM = 8;          // Used for optionLabel marginBottom
export const ICON_MARGIN_RIGHT = 10;           // Used for some label marginBottom, optionTextWrapper marginRight
export const ACTIONS_CONTAINER_MARGIN_TOP = 10;
export const FOOTER_CONTAINER_MARGIN_TOP = 25;
export const ERROR_CONTAINER_MARGIN_VERTICAL = 15; // Used for avatar container/touchable margins, optionCard padding/icon margin
export const ERROR_CONTAINER_PADDING_HORIZONTAL = 10; // Used for selectButton paddingHorizontal
export const ERROR_CONTAINER_PADDING_VERTICAL = 8;    // Used for buttonIcon marginRight
export const HEADER_CONTAINER_MARGIN_BOTTOM = 40;

// Sizes
export const ICON_SIZE_SMALL = 18;             // Used for communicatorOptions icon
export const INPUT_HEIGHT = 52;
export const GENDER_SEGMENT_HEIGHT = 48;
export const BUTTON_MIN_HEIGHT = 52;           // Used for submitButton minHeight

// Font Sizes
export const FONT_SIZE_TITLE = 26;
export const FONT_SIZE_SUBTITLE = 15;          // Used for label fontSize
export const FONT_SIZE_LABEL = 14;             // Used for selectButtonText, errorText, camera overlay icon size
export const FONT_SIZE_INPUT = 16;             // Used for introText, input, optionLabel, submitButtonText
export const FONT_SIZE_GENDER_SEGMENT = 15;
export const FONT_SIZE_ERROR = 14;             // Also FONT_SIZE_LABEL
export const FONT_SIZE_BUTTON = 16;            // Also FONT_SIZE_INPUT
export const FONT_SIZE_FOOTER = 14;            // Also FONT_SIZE_LABEL
export const FONT_SIZE_LINK = 14;              // Also FONT_SIZE_LABEL
export const FONT_SIZE_SMALL = 12;

// Border Radius
export const BORDER_RADIUS_INPUT = 8;          // Used for input, selectButton, errorContainer, submitButton
export const BORDER_RADIUS_GENDER_SEGMENT = 8;
export const BORDER_RADIUS_ERROR = 6;
export const BORDER_RADIUS_BUTTON = 8;         // Also BORDER_RADIUS_INPUT

// Border Width
export const BORDER_WIDTH_INPUT = 1;           // Used for header border, avatar placeholder, input, errorContainer
export const BORDER_WIDTH_GENDER_SEGMENT = 1.5; // Used for selectButton, optionCard, checkIndicator
export const BORDER_WIDTH_ERROR = 1;           // Also BORDER_WIDTH_INPUT

// Elevation/Shadow
export const ELEVATION_BUTTON = 3;
export const SHADOW_OPACITY_BUTTON = 0.15;
export const SHADOW_RADIUS_BUTTON = 4;

// Login Screen or Common Reusable Dimensions
export const ICON_SIZE_MEDIUM = 20;            // Used for faArrowLeft, gridLayoutOptions icon, faCheckCircle icon, sectionTitle fontSize
export const FONT_SIZE_XXLARGE = 48;
export const INPUT_HEIGHT_LARGE = 64;
export const BUTTON_HEIGHT_LARGE = 56;
export const FONT_SIZE_XLARGE = 32;

export const BORDER_RADIUS_LARGE = 24;
export const BORDER_RADIUS_INPUT_LOGIN = 12;   // Used for checkIndicator borderRadius
export const BORDER_RADIUS_BUTTON_LOGIN = 12;

// Margins and Paddings (can be generic or specific)
export const PADDING_SMALL = 8;                // Also ERROR_CONTAINER_PADDING_VERTICAL
export const MARGIN_XXSMALL = 4;               // Used for cameraIconOverlay padding
export const MARGIN_XSMALL = 8;                // Also ERROR_CONTAINER_PADDING_VERTICAL
export const MARGIN_SMALL = 16;                // Used for submitButton paddingVertical
export const MARGIN_MEDIUM = 20;               // Used for innerContainer paddingHorizontal, sectionTitle marginBottom, submitButton marginTop
export const MARGIN_LARGE = 32;
export const MARGIN_XLARGE = 36;               // Used for introText marginBottom (approx)

export const ICON_MARGIN_RIGHT_LOGIN = 12;     // Used for buttonGroup gap, optionCard marginBottom, header paddingVertical

// --- NEW Constants added/repurposed for SigninTwo ---
// Font Sizes
export const FONT_SIZE_PAGE_HEADER = 18;      // For headerTitle fontSize (was ICON_SIZE_SMALL)
export const FONT_SIZE_HELPER = 12;           // For avatarHelperText fontSize
export const FONT_SIZE_DESCRIPTION = 13;      // For optionDescription fontSize

// Icon Sizes
export const ICON_SIZE_AVATAR_PLACEHOLDER = 50; // For faUserCircle in avatar
export const ICON_SIZE_OPTION_CARD = 22;      // For commStyleOptions icon

export const AVATAR_SIZE_SIGNUP = 100;
export const BORDER_RADIUS_AVATAR_SIGNUP = 50;
export const ICON_SIZE_AVATAR_PLACEHOLDER_SIGNUP = 60;

// Component Sizes (Height/Width/MinHeight)
export const AVATAR_SIZE = 80;                // For avatarImage, avatarPlaceholder width/height
export const INPUT_HEIGHT_PROFILE = 50;       // For input height on this screen
export const BUTTON_MIN_HEIGHT_PROFILE = 50;  // For selectButton minHeight
export const OPTION_CARD_MIN_HEIGHT = 80;     // For optionCard minHeight
export const CHECK_INDICATOR_SIZE = 24;       // For checkIndicator width/height
export const HEADER_SPACER_WIDTH = SCREEN_PADDING_VERTICAL; // Used for headerSpacer width (30)

// Border Radius
export const BORDER_RADIUS_AVATAR = AVATAR_SIZE / 2; // 40
export const BORDER_RADIUS_OVERLAY_ICON = 10; // For cameraIconOverlay borderRadius
export const BORDER_RADIUS_CARD = 10;         // For optionCard borderRadius

// Border Width
export const BORDER_WIDTH_AVATAR_IMAGE = 2;   // For avatarImage borderWidth

// Spacing/Padding/Margins specific to SigninTwo or new generics
export const PADDING_HEADER_HORIZONTAL = 15;
export const PADDING_HEADER_VERTICAL = ICON_MARGIN_RIGHT_LOGIN; // 12
export const PADDING_ICON_BUTTON = 5;         // For backButton padding
export const PADDING_INPUT_HORIZONTAL_PROFILE = 15; // For input paddingHorizontal
export const MARGIN_HELPER_TEXT_TOP = 5;

// Line Heights
export const LINE_HEIGHT_INTRO = 23;
export const LINE_HEIGHT_DESCRIPTION = 18;

// Other
export const OPACITY_DISABLED = 0.7;

export const PADDING_MEDIUM = 16; // Or 12, 15, etc. <-- ADD THIS LINE
export const PADDING_LARGE = 24;
