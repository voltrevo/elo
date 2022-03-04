import 'source-map-support/register';

import Database from "../src/database/Database";
import { insertUser, lookupUser } from '../src/database/queries/users';
import config from "./config";

(async () => {
  const db = new Database(config.pgConnString);

  try {
    await insertUser(db, {
      id: 'fake-id3',
      email: 'email3',
      password_hash: 'hash',
      password_salt: 'salt',
      oauth_providers: [],
    });
  
    console.log(await lookupUser(db, { id: 'fake-id3' }));
  } finally {
    await db.disconnect();
  }
})().catch(console.error);
