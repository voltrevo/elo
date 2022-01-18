INSERT INTO hourly_stats (date_, hour, sessions_started)
VALUES ('2022-01-18', 4, 1)
ON CONFLICT (date_, hour)
DO
  UPDATE SET sessions_started = hourly_stats.sessions_started + 1;
