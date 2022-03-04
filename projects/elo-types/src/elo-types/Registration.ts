import * as io from 'io-ts';
import optional from './optional';

const Registration = io.union([
  io.type({
    userId: optional(io.string),
    email: io.string,
    password: io.string,
    code: io.string,
  }),
  io.type({
    userId: optional(io.string),
    googleAccessToken: io.string,
  }),
]);

type Registration = io.TypeOf<typeof Registration>;

export default Registration;
