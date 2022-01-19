/* eslint-disable camelcase */

import PgClient from './PgClient';

export type HourlyStat = {
  hour: Date;
  streams: number;
  speakers: number;
  sessionsStarted: number;
};

export default class DbClient {
  private pgClientState?: {
    client: PgClient;
    connected: boolean;
    connectionPromise: Promise<void>;
  };

  constructor(private pgConnString: string) {}

  private async PgClient(): Promise<PgClient> {
    if (this.pgClientState === undefined) {
      const client = new PgClient(this.pgConnString);

      const state: DbClient['pgClientState'] = {
        client,
        connected: false,
        connectionPromise: client.connect(),
      };

      state.connectionPromise.then(
        () => {
          state.connected = true;
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error(error);

          if (this.pgClientState === state) {
            this.pgClientState = undefined;
          }
        },
      );

      state.client.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error(error);

        if (this.pgClientState === state) {
          this.pgClientState = undefined;
        }
      });

      this.pgClientState = state;
    }

    if (!this.pgClientState.connected) {
      await this.pgClientState.connectionPromise;
    }

    const client = this.pgClientState?.client;

    if (client === undefined) {
      throw new Error('Database connection failed');
    }

    return client;
  }

  async disconnect() {
    const state = this.pgClientState;

    if (state === undefined) {
      return;
    }

    await state.client.end();

    if (this.pgClientState === state) {
      this.pgClientState = undefined;
    }
  }

  async HourlyStats(from: Date, to: Date): Promise<HourlyStat[]> {
    const pgClient = await this.PgClient();

    const res = await pgClient.query(
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

  private async incField(now: Date, field: string) {
    const pgClient = await this.PgClient();

    // Check field is from a fixed list to ensure there's no SQL injection opportunity.
    if (!['streams_pct', 'speakers_pct', 'sessions_started'].includes(field)) {
      throw new Error(`Unrecognized field "${field}"`);
    }

    await pgClient.query(
      `
        INSERT INTO hourly_stats (date_, hour, ${field})
        VALUES ($1, $2, 1)
        ON CONFLICT (date_, hour)
        DO
          UPDATE SET ${field} = hourly_stats.${field} + 1;
      `,
      [
        now.toISOString().split('T')[0],
        now.getUTCHours(),
      ],
    );
  }

  async incStreamsPct(now = new Date()) {
    await this.incField(now, 'streams_pct');
  }

  async incSpeakersPct(now = new Date()) {
    await this.incField(now, 'speakers_pct');
  }

  async incSession(now = new Date()) {
    await this.incField(now, 'sessions_started');
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
