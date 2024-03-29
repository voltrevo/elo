import Range from '../../common-pure/Range';
import { upsertEmailVerification } from '../../database/queries/emailVerification';
import users from '../../database/queries/users';
import { RouteDefinition } from './routeSystem';

const verificationCodeAlphabet = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '123456789',
].join('');

const sendVerificationEmailRoute: RouteDefinition<'sendVerificationEmail'> = async (
  { db, emailService },
  { email },
) => {
  const existingUser = await users.lookup(db, { email });

  if (existingUser) {
    await emailService.send('notifications', {
      recipient: email,
      title: 'Elo Email Verification',
      body: [
        'Hi',
        '',
        [
          'We received a request to send a verification email to this address.',
          'However, an account already exists for this email.',
        ].join(' '),
        '',
        [
          'If you made the request because you are trying to access your',
          'account, please get in touch via our feedback form.',
        ].join(' '),
        '',
        [
          'If you did not make the request, no action is required.',
        ].join(' '),
        '',
        'Sincerely,',
        'The Elo Team',
      ].join('\n'),
    });

    return { ok: {} };
  }

  const code = Range(8).map(
    () => verificationCodeAlphabet[
      Math.floor(Math.random() * verificationCodeAlphabet.length)
    ],
  ).join('');

  await upsertEmailVerification(db, {
    email,
    verification_code: code,
    expires: new Date(Date.now() + 86_400_000),
  });

  await emailService.send('notifications', {
    recipient: email,
    title: 'Elo Email Verification',
    body: [
      'Welcome to Elo!',
      '',
      'Your verification code is:',
      code,
      '',
      'This code is valid for 24 hours.',
    ].join('\n'),
  });

  return { ok: {} };
};

export default sendVerificationEmailRoute;
