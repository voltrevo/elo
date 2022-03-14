import { keccak256 } from 'js-sha3';
import { lookupEmailVerification } from '../../database/queries/emailVerification';
import { lookupUser } from '../../database/queries/users';
import { generateUserId, validateUserId } from '../userIds';
import { RouteDefinition } from './routeSystem';

const passwordHardeningSaltRoute: RouteDefinition<'passwordHardeningSalt'> = async (
  { db, config },
  { email, userIdHint },
) => {
  if (userIdHint !== undefined) {
    if (!validateUserId(config.secrets.userIdGeneration, userIdHint.userId)) {
      return {
        status: 400,
        body: 'Invalid userIdHint',
      };
    }

    const row = await lookupEmailVerification(db, email);

    if (row === undefined || userIdHint.verificationCode !== row.verification_code) {
      return {
        status: 400,
        body: 'Invalid userIdHint',
      };
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

  return {
    ok: { passwordHardeningSalt },
  };
};

export default passwordHardeningSaltRoute;
