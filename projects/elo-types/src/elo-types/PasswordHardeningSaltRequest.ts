import * as io from 'io-ts';

import optional from './optional';

const PasswordHardeningSaltRequest = io.type({
  email: io.string,

  // TODO: Make sure the ability to learn whether accounts exist or have changed from this api is
  // limited.
  userIdHint: optional(io.type({
    verificationCode: io.string,
    userId: io.string,
  })),
});

type PasswordHardeningSaltRequest = io.TypeOf<typeof PasswordHardeningSaltRequest>;

export default PasswordHardeningSaltRequest;
