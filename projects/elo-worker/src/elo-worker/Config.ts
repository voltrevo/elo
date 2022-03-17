import * as io from 'io-ts';
import optional from '../elo-types/optional';

export const OutgoingEmailConfig = io.union([
  io.type({
    type: io.literal('console'),
  }),
  io.type({
    type: io.literal('nodemailer'),
    config: io.type({
      host: io.string,
      port: io.number,
      secure: io.boolean,
      auth: io.type({
        user: io.string,
        pass: io.string,
      }),
    }),
  }),
]);

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
    emailUnsubscribeCodes: io.string,
  }),
  googleOauthClientId: io.string,
  outgoingEmail: io.type({
    notifications: OutgoingEmailConfig,
  }),
});

export type Config = io.TypeOf<typeof Config>;

export type OutgoingEmailType = keyof Config['outgoingEmail'];
export type OutgoingEmailConfig = io.TypeOf<typeof OutgoingEmailConfig>;

export default Config;
