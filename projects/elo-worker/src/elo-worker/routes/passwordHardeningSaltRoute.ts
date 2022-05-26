import { keccak256 } from 'js-sha3';
import users from '../../database/queries/users';
import checkEmailVerification from '../checkEmailVerification';
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

    if (!await checkEmailVerification(db, email, userIdHint.verificationCode)) {
      return {
        status: 400,
        body: 'Invalid userIdHint',
      };
    }
  }

  const existingUser = await users.lookup(db, { email });

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
