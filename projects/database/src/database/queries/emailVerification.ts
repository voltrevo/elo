import * as io from 'io-ts';
import * as ioTypes from 'io-ts-types';

import decode from '../../elo-types/decode';
import Database from "../Database";

const EmailVerificationRow = io.type({
  email: io.string,
  verification_code: io.string,
  expires: ioTypes.date,
});

export type EmailVerificationRow = io.TypeOf<typeof EmailVerificationRow>;

export async function insertEmailVerification(db: Database, {
  email,
  verification_code,
  expires,
}: EmailVerificationRow) {
  const pgClient = await db.PgClient();

  await pgClient.query(
    `
      INSERT INTO email_verification_codes (
        email,
        verification_code,
        expires
      ) VALUES (
        $1,
        $2,
        $3
      )
    `,
    [
      email,
      verification_code,
      expires,
    ],
  );
}

export async function lookupEmailVerification(
  db: Database,
  email: string,
): Promise<EmailVerificationRow | undefined> {
  const pgClient = await db.PgClient();

  const res = await pgClient.query(
    `
      SELECT * FROM email_verification_codes
      WHERE email = $1
    `,
    [email],
  );

  const result = res.rows[0];

  if (result === undefined) {
    return undefined;
  }

  return decode(EmailVerificationRow, result);
}
