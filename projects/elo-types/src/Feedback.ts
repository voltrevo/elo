import * as io from 'io-ts';

import optional from './optional';

const Feedback = io.type({
  sentiment: optional(io.string),
  positive: io.boolean,
  negative: io.boolean,
  message: optional(io.string),
  anonymous: io.boolean,
  emailInterest: io.boolean,
  email: optional(io.string),
});

type Feedback = io.TypeOf<typeof Feedback>;

export default Feedback;
