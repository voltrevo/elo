import DbClient from '../link-src/database/DbClient';
import config from '../src/helpers/serverConfig';
import launch from '../src/helpers/launch';

launch(async () => {
  const db = new DbClient(config.pgConnString);

  const userId = 'demo-user-id-3';

  await Promise.all([
    db.incUserStreamHoursPct(userId),
    db.incUserSpeakingHoursPct(userId),
    db.incUserSessionsStarted(userId),
  ]);

  await db.disconnect();

  return 'done';
});