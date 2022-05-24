import * as io from 'io-ts';

import AggregateStats, { initAggregateStats } from '../../elo-types/AggregateStats';
import optional from '../../elo-types/optional';

const AccountRoot = io.type({
  userId: io.string,
  email: optional(io.string),
  googleAccount: optional(io.string),
  eloLoginToken: optional(io.string),
  settings: io.type({
    liveStatsMode: io.string,
    experimentalZoomSupport: optional(io.literal(true)),
    zoomRedirectToWebClient: optional(io.boolean),
  }),
  aggregateStats: AggregateStats,
  lastSessionKey: optional(io.string),

  // Warning: Please be mindful of the possible need to update mergeAccountRoots if the structure
  // of AccountRoot is changed.
});

type AccountRoot = io.TypeOf<typeof AccountRoot>;

export function initAccountRoot(userId: string): AccountRoot {
  return {
    userId,
    email: undefined,
    googleAccount: undefined,
    eloLoginToken: undefined,
    settings: {
      liveStatsMode: 'count',
      experimentalZoomSupport: undefined,
      zoomRedirectToWebClient: undefined,
    },
    aggregateStats: initAggregateStats(),
    lastSessionKey: undefined,
  };
}

export default AccountRoot;
