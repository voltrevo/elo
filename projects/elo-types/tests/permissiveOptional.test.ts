import * as io from 'io-ts';

import { expect } from "chai";
import decode from "../src/elo-types/decode";
import permissiveOptional from "../src/elo-types/permissiveOptional";
import nil from '../src/common-pure/nil';

describe('permissiveOptional', () => {
  it('decodes null to nil', () => {
    expect(
      decode(permissiveOptional(io.string), null),
    ).to.eq(
      nil
    );
  });

  it('nested case decodes correctly', () => {
    const type = permissiveOptional(io.type({
      differentFrom: permissiveOptional(io.string),
    }));

    expect(
      decode(type, { longPoll: { differentFrom: null } }),
    ).to.eq({
      longPoll: { differentFrom: nil }
    });
  })
});
