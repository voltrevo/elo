import 'source-map-support/register';

import { generateUserId, validateUserId } from '../src/elo-worker/userIds';
import assert from '../src/common-pure/assert';
import base58 from '../src/common-pure/base58';

import testConfig from './testConfig';

const { userIdGenerationSecret } = testConfig;

describe('userIds', () => {
  it('generates user ids', () => {
    const len = generateUserId(userIdGenerationSecret, undefined).length;
    assert(Math.abs(len - 27) <= 2);
  });

  it('generated user id is valid', () => {
    const userId = generateUserId(userIdGenerationSecret, undefined);
    assert(validateUserId(userIdGenerationSecret, userId));
  });

  it('empty string is invalid', () => {
    assert(!validateUserId(userIdGenerationSecret, ''));
  });

  it('altered user id is invalid', () => {
    const id = generateUserId(userIdGenerationSecret, undefined);

    for (let i = 0; i < id.length; i++) {
      const alteredChar = id[i] === 'x' ? 'y' : 'x';
      const alteredId = `${id.slice(0, i)}${alteredChar}${id.slice(i + 1)}`;

      // There's a 1 in ~4b chance it'll be valid by accident 🤷‍♂️
      assert(!validateUserId(userIdGenerationSecret, alteredId));
    }
  });

  it('augmented user id is invalid', () => {
    const id = generateUserId(userIdGenerationSecret, undefined);

    const bytes = new Uint8Array(21); // one byte too long
    bytes.set(new Uint8Array(base58.decode(id)), 0);

    const augmentedId = base58.encode(bytes);

    assert(!validateUserId(userIdGenerationSecret, augmentedId));
  });
});
