import { Client } from 'pg';

import config from './helpers/config';
import launch from './helpers/launch';

launch(async () => {
  const client = new Client(config.server.pgConnString);
  await client.connect();
  const res = await client.query('SELECT * FROM hourly_stats');
  await client.end();

  return res.rows;
});
