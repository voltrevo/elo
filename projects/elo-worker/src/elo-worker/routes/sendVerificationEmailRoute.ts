import Range from '../../common-pure/Range';
import { insertEmailVerification } from '../../database/queries/emailVerification';
import sendEmail from '../sendEmail';
import { RouteDefinition } from './routeSystem';

const verificationCodeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const sendVerificationEmailRoute: RouteDefinition<'sendVerificationEmail'> = async (
  { db },
  { email },
) => {
  const code = Range(6).map(
    () => verificationCodeAlphabet[
      Math.floor(Math.random() * verificationCodeAlphabet.length)
    ],
  ).join('');

  // TODO: upsert
  await insertEmailVerification(db, {
    email,
    verification_code: code,
    expires: new Date(Date.now() + 86_400_000),
  });

  await sendEmail(
    email,
    'Elo Email Verification',
    [
      'Welcome to Elo!',
      '',
      'Your verification code is:',
      code,
      '',
      'This code is valid for 24 hours.',
    ].join('\n'),
  );

  return { ok: {} };
};

export default sendVerificationEmailRoute;
