import * as io from 'io-ts';

import never from '../../common-pure/never';
import nil from '../../common-pure/nil';
import decode from '../../elo-types/decode';
import Database from "../Database";

const User = io.type({
  id: io.string,
  email: io.string,
  password_salt: io.string,
  password_hash: io.union([io.string, io.null]),
  oauth_providers: io.array(io.string),
});

export type User = io.TypeOf<typeof User>;

const users = {
  insert: async (
    db: Database,
    {
      id,
      email,
      password_salt,
      password_hash,
      oauth_providers,
    }: User
  ) => {
    const pgClient = await db.PgClient();
  
    await pgClient.query(
      `
        INSERT INTO users (
          id,
          email,
          password_salt,
          password_hash,
          oauth_providers
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
      `,
      [
        id,
        email,
        password_salt,
        password_hash,
        oauth_providers,
      ],
    );
  },
  lookup: async (
    db: Database,
    query: { id: string } | { email: string },
  ): Promise<User | nil> => {
    const pgClient = await db.PgClient();
  
    let fieldName: 'id' | 'email';
    let fieldValue: string;
  
    if ('id' in query) {
      fieldName = 'id';
      fieldValue = query.id;
    } else if ('email' in query) {
      fieldName = 'email';
      fieldValue = query.email;
    } else {
      never(query);
    }
  
    const res = await pgClient.query(
      `
        SELECT * FROM users
        WHERE ${fieldName} = $1
      `,
      [fieldValue],
    );
  
    const result = res.rows[0];
  
    if (result === nil) {
      return nil;
    }
  
    return decode(User, result);
  },
  lookupStaffEmail: async (
    db: Database,
    userId: string,
  ) => {
    const pgClient = await db.PgClient();
  
    const res = await pgClient.query(
      `
        SELECT users.email FROM users
        JOIN staff_emails on users.email = staff_emails.email
        WHERE id = $1
      `,
      [userId],
    );
  
    const result = res.rows[0];
  
    if (result === nil) {
      return nil;
    }
  
    return decode(io.string, result.email);
  },
};

export default users;
