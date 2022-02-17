import * as io from 'io-ts';

// FIXME: This should be linked (which means nested linking :/)

const FeedbackBody = io.type({
  userId: io.string,
  feedback: io.type({
    sentiment: optional(io.string),
    positive: io.boolean,
    negative: io.boolean,
    message: optional(io.string),
    anonymous: io.boolean,
    emailInterest: io.boolean,
    email: optional(io.string),
  }),
});

export type Feedback = io.TypeOf<typeof FeedbackBody>['feedback'];

function optional<Type extends io.Mixed>(type: Type) {
  return io.union([io.undefined, type]);
}

export default Feedback;
