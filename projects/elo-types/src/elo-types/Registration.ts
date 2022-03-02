type Registration = (
  | { email: string, password: string, code: string }
  | { googleAccessToken: string }
);

export default Registration;
