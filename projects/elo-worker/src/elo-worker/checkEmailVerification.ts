import Database from '../database/Database';
import { lookupEmailVerification } from '../database/queries/emailVerification';

export default async function checkEmailVerification(
  db: Database,
  email: string,
  code: string,
): Promise<boolean> {
  const row = await lookupEmailVerification(db, email);

  if (
    !row ||
    Date.now() > row.expires.getTime()
  ) {
    return false;
  }

  return code === row.verification_code;
}
