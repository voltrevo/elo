import * as io from 'io-ts';
import optional from '../elo-types/optional';

export const Config = io.type({
  pgConnString: io.string,
  host: io.string,
  port: io.number,
  https: optional(io.type({
    key: io.string,
    cert: io.string,
  })),
  secrets: io.type({
    userIdGeneration: io.string,
    tokenEncryption: io.string,
    passwordHardening: io.string,
  }),
  googleOauthClientId: io.string,
});

export type Config = io.TypeOf<typeof Config>;

export default Config;
