import nil from "../common-pure/nil";

type StorageProtocol = {
  get(collectionId: string, elementId: string): Promise<Uint8Array | nil>;
  set(collectionId: string, elementId: string, value: Uint8Array | nil): Promise<void>;
  getRange(collectionId: string, minElementId: string, maxElementId: string): Promise<[string, Uint8Array][]>;
};

export default StorageProtocol;
