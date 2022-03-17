import Database from "../Database";

export async function unsubscribeEmail(db: Database, email: string) {
  const pgClient = await db.PgClient();

  await pgClient.query(
    `
      INSERT INTO unsubscribed_emails (
        email
      ) VALUES (
        $1
      )
    `,
    [
      email,
    ],
  );
}

export async function isUnsubscribedEmail(
  db: Database,
  email: string,
): Promise<boolean> {
  const pgClient = await db.PgClient();
  
  const res = await pgClient.query(
    `
      SELECT * FROM unsubscribed_emails
      WHERE email = $1
    `,
    [
      email,
    ],
  );

  const result = res.rows[0];

  return result !== undefined;
}
