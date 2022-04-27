import nil from "../../common-pure/nil";
import Database from "../Database";

const monthlyGeneralUserStats = {
  get: async (
    db: Database,
    userId: string,
    month: string,
    stat: string,
  ): Promise<number> => {
    const pgClient = await db.PgClient();

    const res = await pgClient.query(
      `
        SELECT
          value
        FROM
          monthly_general_user_stats
        WHERE
          userId = $1 AND
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

    const value = row.value;

    if (typeof value !== 'number') {
      throw new Error('Unexpected format in monthlyGeneralUserStats.get');
    }

    return value;
  },

  add: async (
    db: Database,
    userId: string,
    month: string,
    stat: string,
    dValue: number,
  ) => {
    const pgClient = await db.PgClient();

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
