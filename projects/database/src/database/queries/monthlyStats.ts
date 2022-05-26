import * as io from 'io-ts';
import { Client as PgClient } from 'pg';
import decode from '../../elo-types/decode';

import Database from "../Database";
import postgresNumber from '../helpers/postgresNumber';

export const MonthlyStat = io.type({
  month: io.string,
  active_users: postgresNumber,
  spoken_hours: postgresNumber,
  streamed_hours: postgresNumber,
  sessions: postgresNumber,
});

export type MonthlyStat = io.TypeOf<typeof MonthlyStat>;

const monthlyStats = {
  get: async (
    dbOrClient: Database | PgClient,
  ): Promise<MonthlyStat[]> => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;
    
    const res = await pgClient.query('SELECT * FROM monthly_stats LIMIT 1000');

    return res.rows.map(r => decode(MonthlyStat, r));
  }
};

export default monthlyStats;
