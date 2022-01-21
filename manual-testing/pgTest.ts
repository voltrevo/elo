import DbClient from '../src/database/DbClient';
import config from '../src/helpers/config';
import launch from '../src/helpers/launch';

launch(async () => {
  const db = new DbClient(config.server.pgConnString);

  await Promise.all([
    db.incUserStreamHoursPct('demo-user-id'),
    db.incUserSpeakingHoursPct('demo-user-id'),
    db.incUserSessionsStarted('demo-user-id'),
  ]);

  await db.disconnect();

  return 'done';
});
