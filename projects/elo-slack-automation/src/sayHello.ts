import * as slack from 'slack';

import config from './config';

export default async function sayHello() {
  const resp = await slack.chat.postMessage({
    token: config.slackToken,
    channel: config.feedbackChannel,
    text: 'Hello!',
  });

  console.log('done', resp);
}
