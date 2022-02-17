import * as io from 'io-ts';

export default function optional<Type extends io.Mixed>(type: Type) {
  return io.union([io.undefined, type]);
}
