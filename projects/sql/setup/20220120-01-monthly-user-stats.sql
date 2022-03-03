CREATE TABLE monthly_user_stats (
  user_id VARCHAR NOT NULL,
  month VARCHAR(6) NOT NULL,
  stream_hours_pct BIGINT NOT NULL DEFAULT 0,
  speaking_hours_pct BIGINT NOT NULL DEFAULT 0,
  sessions_started BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
