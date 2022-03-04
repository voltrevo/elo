import Database from '../src/database/Database';
import { incUserSessionsStarted, incUserSpeakingHoursPct, incUserStreamHoursPct } from '../src/database/queries/stats';
import config from './config';
import launch from './launch';

launch(async () => {
  const db = new Database(config.pgConnString);

  const userId = 'demo-user-id-3';

  await Promise.all([
    incUserStreamHoursPct(db, userId),
    incUserSpeakingHoursPct(db, userId),
    incUserSessionsStarted(db, userId),
  ]);

  await db.disconnect();

  return 'done';
});
