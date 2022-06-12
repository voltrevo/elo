import * as io from 'io-ts';

import nil from '../common-pure/nil';

/**
 * msgpack converts nil->null so we need this to do the reverse to give us the correct type when
 * decoding the msgpack output
 */
export default function permissiveOptional<T extends io.Mixed>(type: T) {
  return new io.Type<io.TypeOf<T> | nil, io.TypeOf<T> | nil | null, unknown>(
    `permissiveOptional(${type.name})`,
    (u): u is io.TypeOf<T> | nil => type.is(u) || u === nil,
    (u, c) => {
      if (u === null || u === nil) {
        return io.success(nil);
      }

      if (type.is(u)) {
        return io.success(u);
      }

      return io.failure(u, c);
    },
    a => a,
  );
}
