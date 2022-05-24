import * as io from 'io-ts';

import AggregateStats from '../elo-types/AggregateStats';
import SessionStats from "../elo-types/SessionStats";
import StorageClient, { StorageCollection, StorageElement, StorageTimedCollection } from "../storage-client/StorageClient";
import Settings from "./sharedStorageTypes/Settings";

const True = io.literal(true);

export default class RemoteStorage {
  constructor(
    public storageClient: StorageClient,
  ) {}

  Settings(): StorageElement<typeof Settings> {
    return this.storageClient.Element(Settings, 'settings');
  }

  Sessions(): StorageTimedCollection<typeof SessionStats> {
    return this.storageClient.TimedCollection(SessionStats, 'sessions');
  }

  AggregateStats(): StorageElement<typeof AggregateStats> {
    return this.storageClient.Element(AggregateStats, 'aggregateStats');
  }

  UnaggregatedSessionIds(): StorageCollection<typeof True> {
    return this.storageClient.Collection(True, 'unaggregatedSessionIds');
  }
}
