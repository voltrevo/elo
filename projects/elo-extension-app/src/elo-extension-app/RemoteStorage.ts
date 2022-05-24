import SessionStats from "../elo-types/SessionStats";
import StorageClient, { StorageElement, StorageTimedCollection } from "../storage-client/StorageClient";
import Settings from "./sharedStorageTypes/Settings";

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
}
