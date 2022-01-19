import DbClient from './database/DbClient';
import config from './helpers/config';
import launch from './helpers/launch';

launch(async () => {
  const db = await DbClient.connect(config.server.pgConnString);

  const stats = await db.HourlyStats(
    new Date(Date.now() - 86400000),
    new Date(),
  );

  await db.disconnect();

  return stats;
});
