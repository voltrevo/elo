import Config from './Config';
import Database from '../database/Database';

export default async function run(config: Config) {
  const database = new Database(config.pgConnString);

  console.log('TODO: Run sql queries');
}
