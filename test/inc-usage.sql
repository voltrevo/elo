INSERT INTO agg_usage (date_, hour, concurrent_pct)
VALUES ('2022-01-18', 4, 1)
ON CONFLICT (date_, hour)
DO
  UPDATE SET concurrent_pct = agg_usage.concurrent_pct + 1;
