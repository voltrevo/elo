import * as io from 'io-ts';

const Config = io.type({
  port: io.number,
  slackToken: io.string,
  feedbackChannel: io.string,
  userIdGenerationSecret: io.string,
  pgConnString: io.string,
});

type Config = io.TypeOf<typeof Config>;

export default Config;
