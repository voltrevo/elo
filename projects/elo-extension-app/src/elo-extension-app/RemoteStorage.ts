import StorageClient, { StorageElement } from "../storage-client/StorageClient";
import Settings from "./sharedStorageTypes/Settings";

export default class RemoteStorage {
  constructor(
    public storageClient: StorageClient,
  ) {}

  Settings(): StorageElement<typeof Settings> {
    return this.storageClient.Element(Settings, 'settings');
  }
}
