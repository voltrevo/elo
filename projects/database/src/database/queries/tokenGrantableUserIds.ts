import * as io from 'io-ts';
import { Client as PgClient } from 'pg';

import nil from "../../common-pure/nil";
import decode from '../../elo-types/decode';
import Database from '../Database';

const TokenGrantableUserId = io.type({
  user_id: io.string,
  granted: io.boolean,
});

const tokenGrantableUserIds = {
  lookup: async (
    dbOrClient: Database | PgClient,
    userId: string,
  ) => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    const res = await pgClient.query(
      `
        SELECT * FROM token_grantable_user_ids
        WHERE
          user_id = $1
      `,
      [userId],
    );

    const row = res.rows[0];

    if (row === nil) {
      return nil;
    }

    return decode(TokenGrantableUserId, row);
  },

  setGranted: async (
    dbOrClient: Database | PgClient,
    userId: string,
    granted: boolean,
  ) => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;
    
    await pgClient.query(
      `
        UPDATE token_grantable_user_ids
        SET granted = $2
        WHERE user_id = $1
      `,
      [
        userId,
        granted,
      ],
    );
  },
};

export default tokenGrantableUserIds;
