import * as io from 'io-ts';

const EloLoginTokenData = io.type({
  type: io.literal('elo-login'),
  userId: io.string,
});

type EloLoginTokenData = io.TypeOf<typeof EloLoginTokenData>;

export default EloLoginTokenData;
