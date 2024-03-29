import 'source-map-support/register';

import Database from "../src/database/Database";
import users from '../src/database/queries/users';
import config from "./config";

(async () => {
  const db = new Database(config.pgConnString);

  try {
    await users.insert(db, {
      id: 'fake-id3',
      email: 'email3',
      password_hash: 'hash',
      password_salt: 'salt',
      oauth_providers: [],
    });
  
    console.log(await users.lookup(db, { id: 'fake-id3' }));
  } finally {
    await db.disconnect();
  }
})().catch(console.error);
