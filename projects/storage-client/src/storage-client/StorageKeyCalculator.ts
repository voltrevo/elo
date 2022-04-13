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
    const latestKeyHash = await rpcClient.get('StorageKeyCalculator', 'latestKeyHash');

    if (latestKeyHash === nil) {
      const latestKey = crypto.getRandomValues(new Uint8Array(32));
      const newLatestKeyHash = bufferHash(latestKey);

      await rpcClient.setMulti([
        ['keys', base58.encode(newLatestKeyHash), latestKey],
        ['StorageKeyCalculator', 'latestKeyHash', newLatestKeyHash],
      ]);

      return new StorageKeyCalculator(rpcClient, latestKey);
    }

    if (passwordKey !== nil) {
      if (buffersEqual(latestKeyHash, bufferHash(passwordKey))) {
        return new StorageKeyCalculator(rpcClient, passwordKey);
      }

      const passwordTransitionKeyData = await rpcClient.get('StorageKeyCalculator', 'passwordTransitionKeyData');

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

    const keyData = await rpcClient.get('keys', base58.encode(latestKeyHash));

    if (keyData === nil || keyData.length !== 32) {
      throw new Error(`Failed to calculate latestKey from ${base58.encode(latestKeyHash)}`);
    }

    return new StorageKeyCalculator(rpcClient, keyData);
  }

  async enablePasswordTransition(passwordKey: Uint8Array) {
    const latestKeyHash = await this.rpcClient.get('StorageKeyCalculator', 'latestKeyHash');

    if (latestKeyHash === nil) {
      return;
    }

    const latestKeyData = await this.rpcClient.get('keys', base58.encode(latestKeyHash));
    assert(latestKeyData !== nil);

    if (latestKeyData.length === 32) {
      // Local encryption is not enabled, nothing to do
      return;
    }

    const latestKey = await this.calculateKey(latestKeyHash);

    await this.rpcClient.set(
      'StorageKeyCalculator',
      'passwordTransitionKeyData',
      encryptWithKeyHash(passwordKey, latestKey),
    );
  }

  async enableLocalEncryption(passwordKey: Uint8Array) {
    const previousKeyHash = await this.rpcClient.get('StorageKeyCalculator', 'latestKeyHash');
    assert(previousKeyHash !== nil);
    const previousKey = await this.calculateKey(previousKeyHash);

    await this.rpcClient.setMulti([
      ['keys', base58.encode(previousKeyHash), encryptWithKeyHash(passwordKey, previousKey)],
      ['StorageKeyCalculator', 'latestKeyHash', bufferHash(passwordKey)],
      ['StorageKeyCalculator', 'passwordTransitionKeyData', nil],
    ]);

    this.latestKey = passwordKey;
  }

  async disableLocalEncryption() {
    const latestKeyHash = await this.rpcClient.get('StorageKeyCalculator', 'latestKeyHash');
    assert(latestKeyHash !== nil);
    const latestKey = await this.calculateKey(latestKeyHash);
    await this.rpcClient.set('keys', base58.encode(latestKeyHash), latestKey);
  }

  async calculateKey(keyHash: Uint8Array): Promise<Uint8Array> {
    if (buffersEqual(bufferHash(this.latestKey), keyHash)) {
      return this.latestKey;
    }

    const keyData = await this.rpcClient.get('keys', base58.encode(keyHash));

    if (keyData === nil) {
      throw new Error(`Failed to calculate key from ${keyHash}`);
    }

    if (keyData.length === 32) {
      return keyData;
    }

    const keyDataKeyHash = getKeyHash(keyData);
    const keyDataKey = await this.calculateKey(keyDataKeyHash);

    const key = decryptWithKeyHash(keyDataKey, keyData);

    if (keyDataKeyHash !== bufferHash(this.latestKey)) {
      // Always update old key to be encrypted with latest key if it isn't already
      await this.rpcClient.set('keys', base58.encode(keyHash), encryptWithKeyHash(bufferHash(this.latestKey), key));
    }

    return key;
  }
}
