import DbClient from '../src/database/DbClient';
import config from '../src/helpers/config';
import launch from '../src/helpers/launch';

launch(async () => {
  const db = new DbClient(config.server.pgConnString);

  await Promise.all([
    db.incSession(),
    db.incSpeakersPct(),
    db.incSpeakersPct(),
    db.incStreamsPct(),
    db.incStreamsPct(),
    db.incStreamsPct(),
  ]);

  const stats = await db.HourlyStats(
    new Date(Date.now() - 86400000),
    new Date(Date.now() + 3600000),
  );

  await db.disconnect();

  return stats;
});
