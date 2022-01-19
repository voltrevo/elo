/* eslint-disable camelcase */

import PgClient from './PgClient';

export type HourlyStat = {
  hour: Date;
  streams: number;
  speakers: number;
  sessionsStarted: number;
};

export default class DbClient {
  private constructor(private pgClient: PgClient) {}

  static async connect(pgConnString: string): Promise<DbClient> {
    const pgClient = new PgClient(pgConnString);
    await pgClient.connect();

    return new DbClient(pgClient);
  }

  async disconnect() {
    await this.pgClient.end();
  }

  async HourlyStats(from: Date, to: Date): Promise<HourlyStat[]> {
    const res = await this.pgClient.query(
      `
        SELECT * FROM hourly_stats
        WHERE
          ($1, $2) <= (date_, hour) AND
          (date_, hour) < ($3, $4)
        LIMIT 10000
      `,
      [
        from.toISOString().split('T')[0],
        from.getUTCHours(),
        to.toISOString().split('T')[0],
        to.getUTCHours(),
      ],
    );

    type RawRow = {
      date_: Date,
      hour: number,
      streams_pct: string,
      speakers_pct: string,
      sessions_started: string,
    };

    const rawRows = assertRowType<RawRow>(res.rows, [
      'date_',
      'hour',
      'streams_pct',
      'speakers_pct',
      'sessions_started',
    ]);

    return rawRows.map(({
      date_, hour, streams_pct, speakers_pct, sessions_started,
    }) => ({
      hour: (() => {
        const h = new Date(date_);
        h.setUTCHours(hour);

        return h;
      })(),
      streams: Number(streams_pct) / 100,
      speakers: Number(speakers_pct) / 100,
      sessionsStarted: Number(sessions_started),
    }));
  }
}

function assertRowType<Row>(rows: unknown[], requiredFields: ((keyof Row) & string)[]): Row[] {
  if (rows.length === 0) {
    return [];
  }

  const fields = Object.keys(rows[0] as object);

  const missingField = requiredFields.find(rf => !fields.includes(rf));

  if (missingField !== undefined) {
    throw new Error(`Missing field "${missingField}"`);
  }

  return rows as Row[];
}
