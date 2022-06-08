import * as io from 'io-ts';
import optional from '../elo-types/optional';

export const Config = io.type({
  startupMessage: io.string,
  runForever: optional(io.boolean),
  services: io.array(
    // Using a wide type here so we can do a narrow check explicitly when
    // processing services instead.
    // This simplifies our type information.
    io.type({
      name: io.string,
      instanceName: optional(io.string),
      config: io.unknown,
    }),
  ),
});

export type Config = io.TypeOf<typeof Config>;

export default Config;
