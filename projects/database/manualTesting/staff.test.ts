import 'source-map-support/register';

import Database from "../src/database/Database";
import users from '../src/database/queries/users';
import config from "./config";

(async () => {
  const db = new Database(config.pgConnString);

  try {
    console.log(
      await users.lookupStaffEmail(db, 'asdf') ?? '(not staff)'
    );
  } finally {
    await db.disconnect();
  }
})().catch(console.error);
