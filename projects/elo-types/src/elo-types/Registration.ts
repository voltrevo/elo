import * as io from 'io-ts';
import optional from './optional';

const Registration = io.union([
  io.type({
    // TODO: hint -> request
    userIdHint: optional(io.string),
    email: io.string,
    hardenedPassword: io.string,
    code: io.string,
  }),
  io.type({
    userIdHint: optional(io.string),
    googleAccessToken: io.string,
  }),
]);

type Registration = io.TypeOf<typeof Registration>;

export default Registration;
