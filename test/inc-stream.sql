INSERT INTO hourly_stats (date_, hour, streams_pct)
VALUES ('2022-01-18', 4, 1)
ON CONFLICT (date_, hour)
DO
  UPDATE SET streams_pct = hourly_stats.streams_pct + 1;
