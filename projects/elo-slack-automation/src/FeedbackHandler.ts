import * as io from 'io-ts';
import route from 'koa-route';
import reporter from 'io-ts-reporters';
import * as slack from 'slack';

import config from './config';
import validateUserId from './validateUserId';
import type DbClient from './database/DbClient';

type Handler = Parameters<typeof route.post>[1];

function optional<Type extends io.Mixed>(type: Type) {
  return io.union([io.undefined, type]);
}

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

export default function FeedbackHandler(dbClient: DbClient): Handler {
  return async (ctx) => {
    const decodeResult = FeedbackBody.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    const { userId, feedback } = decodeResult.right;

    if (!validateUserId(userId)) {
      ctx.status = 403;
      return;
    }

    await dbClient.insertFeedback(
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

function renderFeedbackMessage(userId: string, feedback: Feedback): string {
  if (feedback.anonymous) {
    return [
      'Anonymous feedback received',
      feedback.sentiment && `- emoji: ${feedback.sentiment}`,
      feedback.message && `- message: ${feedback.message}`,
    ].filter(line => typeof line === 'string').join('\n');
  }

  return [
    'Feedback received',
    `- from: ${userId}`,
    feedback.sentiment && `- emoji: ${feedback.sentiment}`,
    feedback.message && `- message: ${feedback.message}`,
    feedback.emailInterest && (
      `The user is interested in an email reply at ${feedback.email}`
    ),
  ].filter(line => typeof line === 'string').join('\n');
}