/* eslint-disable camelcase */

import PgClient from './PgClient';
import ReconnectablePgClient from './ReconnectablePgClient';

export type HourlyStat = {
  hour: Date;
  streams: number;
  speakers: number;
  sessionsStarted: number;
};

export default class DbClient {
  reconnectablePgClient: ReconnectablePgClient;

  constructor(pgConnString: string) {
    this.reconnectablePgClient = new ReconnectablePgClient(pgConnString);
  }

  private PgClient(): Promise<PgClient> {
    return this.reconnectablePgClient.PgClient();
  }

  async disconnect() {
    await this.reconnectablePgClient.disconnect();
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

  private async incField(field: string, now: Date) {
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
        formatFullDate(now),
        now.getUTCHours(),
      ],
    );
  }

  async incStreamsPct(now = new Date()) {
    await this.incField('streams_pct', now);
  }

  async incSpeakersPct(now = new Date()) {
    await this.incField('speakers_pct', now);
  }

  async incSession(now = new Date()) {
    await this.incField('sessions_started', now);
  }

  private async incUserMonthlyField(userId: string, field: string, now: Date) {
    const pgClient = await this.PgClient();

    // Check field is from a fixed list to ensure there's no SQL injection opportunity.
    if (!['stream_hours_pct', 'speaking_hours_pct', 'sessions_started'].includes(field)) {
      throw new Error(`Unrecognized field "${field}"`);
    }

    await pgClient.query(
      `
        INSERT INTO monthly_user_stats (user_id, month, ${field})
        VALUES ($1, $2, 1)
        ON CONFLICT (user_id, month)
        DO
          UPDATE SET ${field} = monthly_user_stats.${field} + 1;
      `,
      [
        userId,
        formatFullMonth(now),
      ],
    );
  }

  async incUserStreamHoursPct(userId: string, now = new Date()) {
    await this.incUserMonthlyField(userId, 'stream_hours_pct', now);
  }

  async incUserSpeakingHoursPct(userId: string, now = new Date()) {
    await this.incUserMonthlyField(userId, 'speaking_hours_pct', now);
  }

  async incUserSessionsStarted(userId: string, now = new Date()) {
    await this.incUserMonthlyField(userId, 'sessions_started', now);
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

export function formatFullDate(time: Date): string {
  return time.toISOString().split('T')[0];
}

export function formatFullMonth(time: Date): string {
  return `${time.getUTCFullYear()}${(time.getUTCMonth() + 1).toString().padStart(2, '0')}`;
}
