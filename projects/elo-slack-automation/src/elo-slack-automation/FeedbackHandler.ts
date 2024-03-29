import * as io from 'io-ts';
import route from 'koa-route';
import reporter from 'io-ts-reporters';
import * as slack from 'slack';
import * as uuid from 'uuid';

import validateUserId from './validateUserId';
import type Database from '../database/Database';
import Feedback from '../elo-types/Feedback';
import optional from '../elo-types/optional';
import { insertFeedback } from '../database/queries/feedback';
import nil from '../common-pure/nil';
import Config from './Config';

type Handler = Parameters<typeof route.post>[1];

const FeedbackBody = io.type({
  userId: optional(io.string),
  feedback: Feedback,
});

export default function FeedbackHandler(config: Config, db: Database): Handler {
  return async (ctx) => {
    const decodeResult = FeedbackBody.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      const id = uuid.v4();
      console.error(id, reporter.report(decodeResult));
      ctx.body = { type: 'error', message: id };
      return;
    }

    const { userId, feedback } = decodeResult.right;

    if (userId !== nil && !validateUserId(config.userIdGenerationSecret, userId)) {
      ctx.status = 403;
      return;
    }

    await insertFeedback(
      db,
      feedback.anonymous ? undefined : userId,
      feedback,
    );

    await slack.chat.postMessage({
      token: config.slackToken,
      channel: config.feedbackChannel,
      text: renderFeedbackMessage(userId, feedback),
    });

    ctx.status = 200;
  };
}

function renderFeedbackMessage(userId: string | nil, feedback: Feedback): string {
  if (feedback.anonymous) {
    return [
      'Anonymous feedback received',
      feedback.sentiment && `- emoji: ${feedback.sentiment}`,
      feedback.message && `- message: ${feedback.message}`,
    ].filter(line => typeof line === 'string').join('\n');
  }

  return [
    'Feedback received',
    userId && `- from: ${userId}`,
    feedback.sentiment && `- emoji: ${feedback.sentiment}`,
    feedback.message && `- message: ${feedback.message}`,
    feedback.emailInterest && (
      `The user is interested in an email reply at ${feedback.email}`
    ),
  ].filter(line => typeof line === 'string').join('\n');
}
