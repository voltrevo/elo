import * as io from 'io-ts';
import AggregateStats, { initAggregateStats } from '../../elo-types/AggregateStats';
import optional from '../../elo-types/optional';

const AccountRoot = io.type({
  lastSessionKey: optional(io.string),
  metricPreference: optional(io.string),
  userId: io.string,
  email: optional(io.string),
  googleAccount: optional(io.string),
  eloLoginToken: optional(io.string),
  zoom: optional(io.type({
    redirectToWebClient: io.boolean,
  })),
  aggregateStats: AggregateStats,

  // Warning: Please be mindful of the possible need to update mergeAccountRoots if the structure
  // of AccountRoot is changed.
});

type AccountRoot = io.TypeOf<typeof AccountRoot>;

export function initAccountRoot(userId: string): AccountRoot {
  return {
    lastSessionKey: undefined,
    metricPreference: undefined,
    userId,
    email: undefined,
    googleAccount: undefined,
    eloLoginToken: undefined,
    zoom: undefined,
    aggregateStats: initAggregateStats(),
  };
}

export default AccountRoot;
