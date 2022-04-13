import * as io from 'io-ts';

import './helpers/polyfills';
import assert from '../src/common-pure/assert';
import nil from '../src/common-pure/nil';
import StorageClient from "../src/storage-client/StorageClient";
import StorageKeyCalculator from "../src/storage-client/StorageKeyCalculator";
import MockStorageRpcClient from "./helpers/MockStorageRpcClient";

type Fixture = {
  connect: (passwordKey?: Uint8Array) => Promise<StorageClient>;
};

function FixtureTest(run: (fx: Fixture) => Promise<void>) {
  return async () => {
    const fx: Fixture = {
      connect: async (passwordKey) => {
        const rpcClient = new MockStorageRpcClient();

        const storageClient = new StorageClient(
          rpcClient,
          await StorageKeyCalculator.Create(rpcClient, passwordKey),
        );

        return storageClient;
      },
    };

    await run(fx);
  };
}

describe("StorageClient", () => {
  it("Can get and set a string element", FixtureTest(async fx => {
    const sc = await fx.connect();

    const testElement = sc.Element(io.string, 'test');

    assert(await testElement.get() === nil);

    await testElement.set('foo');
    assert(await testElement.get() === 'foo');

    await testElement.set(nil);
    assert(await testElement.get() === nil);
  }));
});
