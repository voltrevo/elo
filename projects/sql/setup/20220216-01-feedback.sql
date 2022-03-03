CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  time_ TIMESTAMPTZ NOT NULL,
  user_id VARCHAR,
  version_ INT NOT NULL,
  content JSONB NOT NULL
);
