import route from 'koa-route';
import reporter from 'io-ts-reporters';
import { keccak256 } from 'js-sha3';

import AppComponents from '../AppComponents';
import { generateUserId, validateUserId } from '../userIds';
import { lookupEmailVerification } from '../../database/queries/emailVerification';
import { lookupUser } from '../../database/queries/users';
import PasswordHardeningSaltRequest from '../../elo-types/PasswordHardeningSaltRequest';

export default function definePasswordHardeningSalt({
  koaApp, db, config,
}: AppComponents) {
  koaApp.use(route.post('/register', async ctx => {
    const decodeResult = PasswordHardeningSaltRequest.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    // FIXME: Getting `any` from decodeResult.right
    const { email, userIdHint }: PasswordHardeningSaltRequest = decodeResult.right;

    if (userIdHint !== undefined) {
      if (!validateUserId(config.secrets.userIdGeneration, userIdHint.userId)) {
        ctx.status = 400;
        ctx.body = 'Invalid userIdHint';
        return;
      }

      const row = await lookupEmailVerification(db, email);

      if (row === undefined || userIdHint.verificationCode !== row.verification_code) {
        ctx.status = 400;
        ctx.body = 'Invalid userIdHint';
        return;
      }
    }

    const existingUser = await lookupUser(db, { email });

    const userId = (
      existingUser?.id ??
      userIdHint?.userId ??
      generateUserId(config.secrets.userIdGeneration, email)
    );

    const passwordHardeningSalt = keccak256(
      `${config.secrets.passwordHardening}:${userId}`,
    );

    ctx.status = 200;
    ctx.body = { passwordHardeningSalt };
  }));
}
