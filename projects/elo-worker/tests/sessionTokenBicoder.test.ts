import 'source-map-support/register';

import assert from '../src/helpers/assert';
import ErrorData from '../src/helpers/ErrorData';

import SessionTokenBicoder from '../src/SessionTokenBicoder';
import testConfig from './testConfig';

describe('sessionTokenBicoder', () => {
  it('encodes and decodes a session token', async () => {
    const stb = new SessionTokenBicoder({ config: testConfig });

    const token = stb.encode({ userId: 'test-user-id' });
    const decodeResult = stb.decode(token);

    assert(!(decodeResult instanceof ErrorData));
    assert(decodeResult.userId === 'test-user-id');
  });
});
