import * as io from 'io-ts';
import reporter from 'io-ts-reporters';

const rawConfig = require('../../../config.json');

const Config = io.type({
  port: io.number,
  slackToken: io.string,
  feedbackChannel: io.string,
  userIdGenerationSecret: io.string,
  pgConnString: io.string,
});

const decodeResult = Config.decode(rawConfig);

if ('left' in decodeResult) {
  throw new Error(reporter.report(decodeResult).join('\n'));
}

const config = decodeResult.right;

export default config;
