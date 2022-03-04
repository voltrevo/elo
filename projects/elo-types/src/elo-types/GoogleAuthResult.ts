import * as io from 'io-ts';

export const GoogleAuthResult = io.type({
  token: io.string,
  registered: io.boolean,
  detail: io.type({
    issued_to: io.string,
    expires_in: io.number,
    email: io.string,
    verified_email: io.boolean,
  }),
});

export type GoogleAuthResult = io.TypeOf<typeof GoogleAuthResult>;
