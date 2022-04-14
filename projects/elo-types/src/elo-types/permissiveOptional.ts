import * as io from 'io-ts';

import nil from '../common-pure/nil';

export default function permissiveOptional<T extends io.Mixed>(type: T) {
  return new io.Type<io.TypeOf<T> | nil, io.TypeOf<T> | nil | null, unknown>(
    'permissiveOptional',
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
