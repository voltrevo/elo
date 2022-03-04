type LoginCredentials = (
  | { email: string; hardenedPassword: string }
  | { googleAccessToken: string }
);

export default LoginCredentials;
