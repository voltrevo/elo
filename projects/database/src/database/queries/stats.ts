import DbClient from "../DbClient";

export type HourlyStat = {
  hour: Date;
  streams: number;
  speakers: number;
  sessionsStarted: number;
};

export async function HourlyStats(db: DbClient, from: Date, to: Date): Promise<HourlyStat[]> {
  const pgClient = await db.PgClient();

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

async function incField(db: DbClient, field: string, now: Date) {
  const pgClient = await db.PgClient();

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

export async function incStreamsPct(db: DbClient, now = new Date()) {
  await incField(db, 'streams_pct', now);
}

export async function incSpeakersPct(db: DbClient, now = new Date()) {
  await incField(db, 'speakers_pct', now);
}

export async function incSession(db: DbClient, now = new Date()) {
  await incField(db, 'sessions_started', now);
}

async function incUserMonthlyField(db: DbClient, userId: string, field: string, now: Date) {
  const pgClient = await db.PgClient();

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

export async function incUserStreamHoursPct(db: DbClient, userId: string, now = new Date()) {
  await incUserMonthlyField(db, userId, 'stream_hours_pct', now);
}

export async function incUserSpeakingHoursPct(db: DbClient, userId: string, now = new Date()) {
  await incUserMonthlyField(db, userId, 'speaking_hours_pct', now);
}

export async function incUserSessionsStarted(db: DbClient, userId: string, now = new Date()) {
  await incUserMonthlyField(db, userId, 'sessions_started', now);
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
