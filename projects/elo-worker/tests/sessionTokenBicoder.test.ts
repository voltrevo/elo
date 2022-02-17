import 'source-map-support/register';

import assert from '../link-src/common-pure/assert';
import ErrorData from '../link-src/common-pure/ErrorData';

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
