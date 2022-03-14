CREATE TABLE users (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_salt TEXT NOT NULL,
  oauth_providers TEXT[] NOT NULL
);

CREATE INDEX users_by_email ON users (email);
