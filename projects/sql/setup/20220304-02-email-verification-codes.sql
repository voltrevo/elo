CREATE TABLE email_verification_codes (
  email TEXT NOT NULL PRIMARY KEY,
  verification_code TEXT NOT NULL,
  expires TIMESTAMP NOT NULL
);
