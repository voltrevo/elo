import 'source-map-support/register';

import Database from "../src/database/Database";
import { insertEmailVerification, lookupEmailVerification } from '../src/database/queries/emailVerification';
import config from "./config";

(async () => {
  const db = new Database(config.pgConnString);

  try {
    await insertEmailVerification(db, {
      email: 'email',
      verification_code: 'asdf123',
      expires: new Date(),
    });
  
    console.log(await lookupEmailVerification(db, 'email'));
  } finally {
    await db.disconnect();
  }
})().catch(console.error);
