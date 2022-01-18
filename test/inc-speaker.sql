INSERT INTO hourly_stats (date_, hour, speakers_pct)
VALUES ('2022-01-18', 4, 1)
ON CONFLICT (date_, hour)
DO
  UPDATE SET speakers_pct = hourly_stats.speakers_pct + 1;
