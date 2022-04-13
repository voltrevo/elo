import { IStorageRpcClient } from "../../src/storage-client/StorageRpcClient";

export default class MockStorageRpcClient implements IStorageRpcClient {
  get(collectionId: string, elementId: string): Promise<Uint8Array | undefined> {
    throw new Error("Method not implemented.");
  }

  set(collectionId: string, elementId: string, value: Uint8Array | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }

  setMulti(setCommands: [collectionId: string, elementId: string, value: Uint8Array | undefined][]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getRange(collectionId: string, minElementId: string, maxElementId: string): Promise<[string, Uint8Array][]> {
    throw new Error("Method not implemented.");
  }  
}
