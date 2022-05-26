CREATE VIEW monthly_stats as SELECT
  month,
  count(user_id) as active_users,
  sum(speaking_hours_pct) / 100 as spoken_hours,
  sum(stream_hours_pct) / 100 as streamed_hours,
  sum(sessions_started) as sessions
FROM monthly_user_stats
WHERE speaking_hours_pct >= 8
GROUP BY month
ORDER BY (month COLLATE "C") DESC;
