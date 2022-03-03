import * as io from 'io-ts';
import optional from '../../elo-types/optional';

const AccountRoot = io.type({
  lastSessionKey: optional(io.string),
  metricPreference: optional(io.string),
  userId: optional(io.string),
  email: optional(io.string),
  googleAccount: optional(io.string),
});

type AccountRoot = io.TypeOf<typeof AccountRoot>;

export function initAccountRoot(): AccountRoot {
  return {
    lastSessionKey: undefined,
    metricPreference: undefined,
    userId: undefined,
    email: undefined,
    googleAccount: undefined,
  };
}

export default AccountRoot;
