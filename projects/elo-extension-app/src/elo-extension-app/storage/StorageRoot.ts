import * as io from 'io-ts';

import optional from '../../elo-types/optional';
import storageVersion from './storageVersion';

const StorageRoot = io.type({
  lastSessionKey: optional(io.string),
  metricPreference: optional(io.string),
  userId: optional(io.string),
  installTriggered: optional(io.literal(true)),
  accountRoot: optional(io.string),
  storageVersion: optional(io.number),
});

type StorageRoot = io.TypeOf<typeof StorageRoot>;

export function initStorageRoot(): StorageRoot {
  return {
    lastSessionKey: undefined,
    metricPreference: undefined,
    userId: undefined,
    installTriggered: undefined,
    accountRoot: undefined,
    storageVersion,
  };
}

export default StorageRoot;
