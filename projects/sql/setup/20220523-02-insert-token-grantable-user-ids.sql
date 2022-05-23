INSERT INTO token_grantable_user_ids
SELECT DISTINCT(user_id), false as granted FROM monthly_user_stats
LEFT JOIN users
ON monthly_user_stats.user_id = users.id
WHERE users.id IS NULL;
