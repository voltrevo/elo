import * as slack from 'slack';

const config = require('../../config.json');

const slackToken: string = config.slackToken;

export default async function sayHello() {
  const resp = await slack.chat.postMessage({
    token: slackToken,
    channel: 'automation-testing',
    text: 'Hello!',
  });

  console.log('done', resp);
}
