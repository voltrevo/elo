SELECT month, COUNT(user_id)
FROM monthly_user_stats
GROUP BY month
ORDER BY month DESC
LIMIT 12
