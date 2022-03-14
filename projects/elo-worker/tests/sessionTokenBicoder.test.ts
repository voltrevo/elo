import 'source-map-support/register';

import assert from '../src/common-pure/assert';
import ErrorData from '../src/common-pure/ErrorData';
import SessionTokenData from '../src/elo-worker/SessionTokenData';

import TokenBicoder from '../src/elo-worker/TokenBicoder';
import testConfig from './testConfig';

describe('sessionTokenBicoder', () => {
  it('encodes and decodes a session token', async () => {
    const stb = new TokenBicoder({ config: testConfig }, SessionTokenData, 7 * 86400);

    const token = stb.encode({ userId: 'test-user-id' });
    const decodeResult = stb.decode(token);

    assert(!(decodeResult instanceof ErrorData));
    assert(decodeResult.userId === 'test-user-id');
  });
});
