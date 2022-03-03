DROP TABLE agg_usage;

CREATE TABLE hourly_stats (
  date_ DATE NOT NULL,
  hour INT NOT NULL,
  streams_pct BIGINT NOT NULL DEFAULT 0,
  speakers_pct BIGINT NOT NULL DEFAULT 0,
  sessions_started BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (date_, hour)
);
