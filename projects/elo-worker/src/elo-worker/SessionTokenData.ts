import * as io from 'io-ts';

const SessionTokenData = io.type({
  userId: io.string,
});

type SessionTokenData = io.TypeOf<typeof SessionTokenData>;

export default SessionTokenData;
