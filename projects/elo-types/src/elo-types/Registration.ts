type Registration = (
  | { userId?: string; email: string; password: string; code: string }
  | { userId?: string; googleAccessToken: string }
);

export default Registration;
