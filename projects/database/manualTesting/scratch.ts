import 'source-map-support/register';

import DbClient from "../src/database/DbClient";
import config from "./config";

(async () => {
  const dbClient = new DbClient(config.pgConnString);

  try {
    await dbClient.insertUser({
      id: 'fake-id3',
      email: 'email3',
      password_hash: 'hash',
      password_salt: 'salt',
      oauth_providers: [],
    });
  
    console.log(await dbClient.lookupUser({ id: 'fake-id3' }));
  } finally {
    await dbClient.disconnect();
  }
})().catch(console.error);
