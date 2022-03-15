import * as io from 'io-ts';
import optional from '../../elo-types/optional';

const AccountRoot = io.type({
  lastSessionKey: optional(io.string),
  metricPreference: optional(io.string),
  userId: optional(io.string),
  email: optional(io.string),
  googleAccount: optional(io.string),
  eloLoginToken: optional(io.string),

  // Warning: Please be mindful of the possible need to update mergeAccountRoots if the structure
  // of AccountRoot is changed.
});

type AccountRoot = io.TypeOf<typeof AccountRoot>;

export function initAccountRoot(): AccountRoot {
  return {
    lastSessionKey: undefined,
    metricPreference: undefined,
    userId: undefined,
    email: undefined,
    googleAccount: undefined,
    eloLoginToken: undefined,
  };
}

export default AccountRoot;
