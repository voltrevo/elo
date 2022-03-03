type LoginCredentials = (
  | { email: string; password: string }
  | { googleAccessToken: string }
);

export default LoginCredentials;
