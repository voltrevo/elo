CREATE TABLE monthly_general_user_stats (
  user_id VARCHAR NOT NULL,
  month VARCHAR(6) NOT NULL,
  stat VARCHAR NOT NULL,
  value BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month, stat)
);
