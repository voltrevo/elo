import { Client } from 'pg';
import config from './helpers/config';

console.log('test');

const client = new Client(config.server.pgConnString);

(async () => {
  console.log('connecting');
  await client.connect();
  console.log('running query');
  const res = await client.query('SELECT * FROM hourly_stats');
  console.log('query finished');
  console.log('result: ', JSON.stringify(res.rows));
})().catch(console.error);
