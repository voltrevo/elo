import 'source-map-support/register';

import { generateUserId, validateUserId } from '../src/elo-worker/userIds';
import assert from '../src/common-pure/assert';
import base58 from '../src/common-pure/base58';

describe('userIds', () => {
  it('generates user ids', () => {
    const len = generateUserId().length;
    assert(Math.abs(len - 27) <= 2);
  });

  it('generated user id is valid', () => {
    assert(validateUserId(generateUserId()));
  });

  it('empty string is invalid', () => {
    assert(!validateUserId(''));
  });

  it('altered user id is invalid', () => {
    const id = generateUserId();

    for (let i = 0; i < id.length; i++) {
      const alteredChar = id[i] === 'x' ? 'y' : 'x';
      const alteredId = `${id.slice(0, i)}${alteredChar}${id.slice(i + 1)}`;

      // There's a 1 in ~4b chance it'll be valid by accident 🤷‍♂️
      assert(!validateUserId(alteredId));
    }
  });

  it('augmented user id is invalid', () => {
    const id = generateUserId();

    const bytes = new Uint8Array(21); // one byte too long
    bytes.set(new Uint8Array(base58.decode(id)), 0);

    const augmentedId = base58.encode(bytes);

    assert(!validateUserId(augmentedId));
  });
});
