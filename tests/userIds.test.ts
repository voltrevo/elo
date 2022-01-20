import { generateUserId } from '../src/userIds';
import assert from '../src/helpers/assert';

describe('userIds', () => {
  it('generates user ids', () => {
    const len = generateUserId().length;
    assert(Math.abs(len - 27) <= 2);
  });
});
