import { Client as PgClient } from 'pg';

import nil from "../../common-pure/nil";
import Database from "../Database";

const monthlyGeneralUserStats = {
  get: async (
    dbOrClient: Database | PgClient,
    userId: string,
    month: string,
    stat: string,
  ): Promise<number> => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    const res = await pgClient.query(
      `
        SELECT
          value
        FROM
          monthly_general_user_stats
        WHERE
          user_id = $1 AND
          month = $2 AND
          stat = $3
      `,
      [
        userId,
        month,
        stat,
      ],
    );

    const row = res.rows[0];

    if (row === nil) {
      return 0;
    }

    return Number(row.value);
  },

  add: async (
    dbOrClient: Database | PgClient,
    userId: string,
    month: string,
    stat: string,
    dValue: number,
  ) => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    await pgClient.query(
      `
        INSERT INTO monthly_general_user_stats (user_id, month, stat, value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, month, stat)
        DO
          UPDATE SET value = monthly_general_user_stats.value + $4;
      `,
      [
        userId,
        month,
        stat,
        dValue,
      ],
    );
  }
};

export default monthlyGeneralUserStats;
