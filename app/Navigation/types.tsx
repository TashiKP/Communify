export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  CustomPage: undefined; // Assuming this exists
  NavBarPage: undefined; // Assuming this exists
  Signup: undefined;

  // *** ADD THIS LINE ***
  SigninTwo: { email?: string }; // Define SigninTwo and its optional email parameter

};

// Optional: Define screen prop types (good practice)
// export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
// export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;
// export type SigninTwoScreenProps = NativeStackScreenProps<RootStackParamList, 'SigninTwo'>;
// etc.