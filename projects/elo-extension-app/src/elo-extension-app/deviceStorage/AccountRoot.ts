import * as io from 'io-ts';

import AggregateStats, { initAggregateStats } from '../../elo-types/AggregateStats';
import optional from '../../elo-types/optional';
import Settings, { defaultSettings } from '../sharedStorageTypes/Settings';

const AccountRoot = io.type({
  userId: io.string,
  email: optional(io.string),
  googleAccount: optional(io.string),
  eloLoginToken: optional(io.string),
  settings: Settings,
  aggregateStats: AggregateStats,
  lastSessionKey: optional(io.string),
  remoteMigrations: optional(io.type({
    settings: optional(
      io.type({
        stage: io.literal('complete'),
      }),
    ),
    sessions: optional(io.union([
      io.type({
        stage: io.literal('in-progress'),
        detailKey: io.string,
      }),
      io.type({
        stage: io.literal('complete'),
      }),
    ])),
  })),

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
    settings: defaultSettings,
    aggregateStats: initAggregateStats(),
    lastSessionKey: undefined,
    remoteMigrations: undefined,
  };
}

export default AccountRoot;
