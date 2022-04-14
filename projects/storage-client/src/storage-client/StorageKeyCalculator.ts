import assert from "../common-pure/assert";
import base58 from "../common-pure/base58";
import buffersEqual from "../common-pure/buffersEqual";
import nil from "../common-pure/nil";
import { bufferHash, decryptWithKeyHash, encryptWithKeyHash, getKeyHash } from "./encryption";
import type { IStorageRpcClient } from "./StorageRpcClient";

export default class StorageKeyCalculator {
  private constructor(
    public rpcClient: IStorageRpcClient,
    public latestKey: Uint8Array,
  ) {}

  static async Create(
    rpcClient: IStorageRpcClient,
    passwordKey: Uint8Array | nil,
  ) {
    const { element: latestKeyHash } = await rpcClient.get({ collectionId: 'StorageKeyCalculator', elementId: 'latestKeyHash' });

    if (latestKeyHash === nil) {
      const latestKey = crypto.getRandomValues(new Uint8Array(32));
      const newLatestKeyHash = bufferHash(latestKey);

      await rpcClient.setMulti({
        commands: [
          {
            collectionId: 'keys',
            elementId: base58.encode(newLatestKeyHash),
            element: latestKey,
          },
          {
            collectionId: 'StorageKeyCalculator',
            elementId: 'latestKeyHash',
            element: newLatestKeyHash,
          },
        ],
      });

      return new StorageKeyCalculator(rpcClient, latestKey);
    }

    if (passwordKey !== nil) {
      if (buffersEqual(latestKeyHash, bufferHash(passwordKey))) {
        return new StorageKeyCalculator(rpcClient, passwordKey);
      }

      const { element: passwordTransitionKeyData } = await rpcClient.get({
        collectionId: 'StorageKeyCalculator',
        elementId: 'passwordTransitionKeyData',
      });

      if (
        passwordTransitionKeyData !== nil &&
        buffersEqual(getKeyHash(passwordTransitionKeyData), bufferHash(passwordKey))
      ) {
        const passwordTransitionKey = decryptWithKeyHash(passwordKey, passwordTransitionKeyData);

        if (buffersEqual(latestKeyHash, bufferHash(passwordTransitionKey))) {
          const skc = new StorageKeyCalculator(rpcClient, passwordTransitionKey);
          await skc.enableLocalEncryption(passwordKey);
          return skc;
        }
      }
    }

    const { element: keyData } = await rpcClient.get({
      collectionId: 'keys',
      elementId: base58.encode(latestKeyHash),
    });

    if (keyData === nil || keyData.length !== 32) {
      throw new Error(`Failed to calculate latestKey from ${base58.encode(latestKeyHash)}`);
    }

    return new StorageKeyCalculator(rpcClient, keyData);
  }

  async enablePasswordTransition(passwordKey: Uint8Array) {
    const { element: latestKeyHash } = await this.rpcClient.get({
      collectionId: 'StorageKeyCalculator',
      elementId: 'latestKeyHash',
    });

    if (latestKeyHash === nil) {
      return;
    }

    const { element: latestKeyData } = await this.rpcClient.get({
      collectionId: 'keys',
      elementId: base58.encode(latestKeyHash),
    });

    assert(latestKeyData !== nil);

    if (latestKeyData.length === 32) {
      // Local encryption is not enabled, nothing to do
      return;
    }

    const latestKey = await this.calculateKey(latestKeyHash);

    await this.rpcClient.set({
      collectionId: 'StorageKeyCalculator',
      elementId: 'passwordTransitionKeyData',
      element: encryptWithKeyHash(passwordKey, latestKey),
    });
  }

  async usesLocalEncryption(): Promise<boolean> {
    const { element: latestKeyHash } = await this.rpcClient.get({
      collectionId: 'StorageKeyCalculator',
      elementId: 'latestKeyHash',
    });

    assert(latestKeyHash !== nil);

    const { element: keyData } = await this.rpcClient.get({
      collectionId: 'keys',
      elementId: base58.encode(latestKeyHash),
    });

    assert(keyData !== nil);

    return keyData.length > 32;
  }

  async enableLocalEncryption(passwordKey: Uint8Array) {
    const { element: previousKeyHash } = await this.rpcClient.get({
      collectionId: 'StorageKeyCalculator',
      elementId: 'latestKeyHash',
    });

    assert(previousKeyHash !== nil);
    const previousKey = await this.calculateKey(previousKeyHash);

    await this.rpcClient.setMulti({
      commands: [
        {
          collectionId: 'keys',
          elementId: base58.encode(previousKeyHash),
          element: encryptWithKeyHash(passwordKey, previousKey),
        },
        {
          collectionId: 'StorageKeyCalculator',
          elementId: 'latestKeyHash',
          element: bufferHash(passwordKey),
        },
        {
          collectionId: 'StorageKeyCalculator',
          elementId: 'passwordTransitionKeyData',
          element: nil,
        },
      ],
    });

    this.latestKey = passwordKey;
  }

  async disableLocalEncryption() {
    const { element: latestKeyHash } = await this.rpcClient.get({
      collectionId: 'StorageKeyCalculator',
      elementId: 'latestKeyHash',
    });

    assert(latestKeyHash !== nil);
    const latestKey = await this.calculateKey(latestKeyHash);

    await this.rpcClient.set({
      collectionId: 'keys',
      elementId: base58.encode(latestKeyHash),
      element: latestKey,
    });
  }

  async calculateKey(keyHash: Uint8Array): Promise<Uint8Array> {
    if (buffersEqual(bufferHash(this.latestKey), keyHash)) {
      return this.latestKey;
    }

    const { element: keyData } = await this.rpcClient.get({
      collectionId: 'keys',
      elementId: base58.encode(keyHash),
    });

    if (keyData === nil) {
      throw new Error(`Failed to calculate key from ${base58.encode(keyHash)}`);
    }

    if (keyData.length === 32) {
      return keyData;
    }

    const keyDataKeyHash = getKeyHash(keyData);
    const keyDataKey = await this.calculateKey(keyDataKeyHash);

    const key = decryptWithKeyHash(keyDataKey, keyData);

    if (!buffersEqual(keyDataKeyHash, bufferHash(this.latestKey))) {
      // Always update old key to be encrypted with latest key if it isn't already
      await this.rpcClient.set({
        collectionId: 'keys',
        elementId: base58.encode(keyHash),
        element: encryptWithKeyHash(this.latestKey, key),
      });
    }

    return key;
  }
}
