CREATE TABLE users (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT,
  password_hash TEXT,
  oauth_providers TEXT[]
);

CREATE INDEX users_by_email ON users (email);
