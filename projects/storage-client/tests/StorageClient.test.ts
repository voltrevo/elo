import 'source-map-support/register';

import * as io from 'io-ts';

import './helpers/polyfills';
import assert from '../src/common-pure/assert';
import shuffle from '../src/common-pure/shuffle';
import nil from '../src/common-pure/nil';
import StorageClient from "../src/storage-client/StorageClient";
import StorageKeyCalculator from "../src/storage-client/StorageKeyCalculator";
import MockStorageRpcClient from "./helpers/MockStorageRpcClient";
import assertThrow from './helpers/assertThrow';
import Range from '../src/common-pure/Range';

type Fixture = {
  connect: (passwordKey?: Uint8Array) => Promise<StorageClient>;
  PasswordKey: () => Uint8Array;
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
      PasswordKey: () => {
        return crypto.getRandomValues(new Uint8Array(32));
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

  it("Does not use passwordKey by default", FixtureTest(async fx => {
    {
      // Connect with a passwordKey and set test->foo
      const sc = await fx.connect(fx.PasswordKey());
      await sc.Element(io.string, 'test').set('foo');
    }

    {
      // Connect without a password and check we can read test->foo
      const sc = await fx.connect();
      assert(await sc.Element(io.string, 'test').get() === 'foo');
    }
  }));

  it("Can enable local encryption and read on a new connection", FixtureTest(async fx => {
    const passwordKey = fx.PasswordKey();

    {
      const sc = await fx.connect();
      await sc.keyCalculator.enableLocalEncryption(passwordKey);
      await sc.Element(io.string, 'test').set('foo');
    }

    {
      const sc = await fx.connect(passwordKey);
      assert(await sc.Element(io.string, 'test').get() === 'foo');
    }
  }));

  it("After enabling local encryption, new connection with missing or incorrect passwordKey fails", FixtureTest(async fx => {
    const passwordKey = fx.PasswordKey();

    {
      const sc = await fx.connect();
      await sc.keyCalculator.enableLocalEncryption(passwordKey);
    }

    {
      await assertThrow(() => fx.connect());
      await assertThrow(() => fx.connect(fx.PasswordKey()));
    }
  }));

  it("Can enable local encryption after using non-local encryption. New data is protected and old data becomes protected when accessed.", FixtureTest(async fx => {
    const passwordKey = fx.PasswordKey();

    // Primary client that will be used to enable local encryption
    const primaryClient = await fx.connect();

    // Outdated client which will not be updated with the passwordKey when local encryption is
    // enabled.
    // This will demonstrate that old data is still readable and that attempts to read new data will
    // fail.
    const outdatedClient = await fx.connect();

    await primaryClient.Element(io.string, 'old key').set('old data');
    await primaryClient.keyCalculator.enableLocalEncryption(passwordKey);
    await primaryClient.Element(io.string, 'new key').set('new data');

    // outdatedClient can read 'old key' but not 'new key'
    assert(await outdatedClient.Element(io.string, 'old key').get() === 'old data');
    assertThrow(() => outdatedClient.Element(io.string, 'new key').get());

    // primaryClient can read both
    assert(await primaryClient.Element(io.string, 'old key').get() === 'old data');
    assert(await primaryClient.Element(io.string, 'new key').get() === 'new data');

    // Now that primaryClient has accessed 'old key' its encryption has been updated and
    // outdatedClient can no longer read it
    assertThrow(() => outdatedClient.Element(io.string, 'old key').get());
  }));

  it("Data written by outdatedClient can be read by primaryClient that has enabled local encryption", FixtureTest(async fx => {
    const outdatedClient = await fx.connect();
    const primaryClient = await fx.connect();

    await primaryClient.keyCalculator.enableLocalEncryption(fx.PasswordKey());

    // outdatedClient doesn't know about the encryption update but continues working
    await outdatedClient.Element(io.string, 'test').set('foo');
    assert(await outdatedClient.Element(io.string, 'test').get() === 'foo');

    // primaryClient can read that data even though it's using updated encryption
    assert(await primaryClient.Element(io.string, 'test').get() === 'foo');

    // outdatedClient has lost the ability to read 'test' because primaryClient updated its encryption by accessing it
    assertThrow(() => outdatedClient.Element(io.string, 'test').get());
  }));

  it("Can disable local encryption, data becomes accessible without passwordKey", FixtureTest(async fx => {
    const passwordKey = fx.PasswordKey();

    {
      // Enable local encryption and set some data
      const sc = await fx.connect();
      await sc.keyCalculator.enableLocalEncryption(passwordKey);
      await sc.Element(io.string, 'test').set('foo');
    }

    {
      // Disable local encryption
      const sc = await fx.connect(passwordKey);
      await sc.keyCalculator.disableLocalEncryption();
    }

    {
      // Access data without passwordKey
      const sc = await fx.connect();
      assert(await sc.Element(io.string, 'test').get() === 'foo');
    }
  }));

  it("Can set data across many key upgrades and still read everything", FixtureTest(async fx => {
    let passwordKey = fx.PasswordKey();

    for (let i = 0; i < 20; i++) {
      const sc = await fx.connect(passwordKey);
      passwordKey = fx.PasswordKey();
      await sc.keyCalculator.enableLocalEncryption(passwordKey);
      await sc.Element(io.string, `test${i}`).set(`foo${i}`);
    }

    const sc = await fx.connect(passwordKey);

    for (const i of shuffle(Range(20))) {
      assert(await sc.Element(io.string, `test${i}`).get() === `foo${i}`);
    }
  }));
});
