import 'source-map-support/register';

import Database from "../src/database/Database";
import monthlyStats from '../src/database/queries/monthlyStats';
import config from "./config";

(async () => {
  const db = new Database(config.pgConnString);

  try {
    console.log(await monthlyStats.get(db));
  } finally {
    await db.disconnect();
  }
})().catch(console.error);
