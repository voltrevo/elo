import * as io from 'io-ts';

const LoginCredentials = io.union([
  io.type({
    email: io.string,
    hardenedPassword: io.string,
  }),
  io.type({
    googleAccessToken: io.string,
  }),
]);

type LoginCredentials = io.TypeOf<typeof LoginCredentials>;

export default LoginCredentials;
