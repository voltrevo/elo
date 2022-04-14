import 'source-map-support/register';

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
    const rpcClient = new MockStorageRpcClient();

    const fx: Fixture = {
      connect: async (passwordKey) => {
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

  it("Can set and then get on a new connection", FixtureTest(async fx => {
    {
      // This will establish a key
      const sc = await fx.connect();
      await sc.Element(io.string, 'test').set('foo');
    }

    {
      // New connection has to recover the key from the first connection
      // (key is open by default, this is intended - by always encrypting we reduce the chance of
      // accidental observation of user data and simplify the transition to a user controlled key)
      const sc = await fx.connect();
      assert(await sc.Element(io.string, 'test').get() === 'foo');
    }
  }));
});
