INSERT INTO monthly_user_stats (user_id, month, speaking_hours_pct)
VALUES ('demo-user-id-2', '202107', 1)
ON CONFLICT (user_id, month)
DO
  UPDATE SET speaking_hours_pct = monthly_user_stats.speaking_hours_pct + 1;
