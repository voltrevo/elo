/* eslint-disable no-console */

import Database from '../src/database/Database';
import delay from '../src/common-pure/delay';
import launch from './launch';
import config from './config';
import { HourlyStats } from '../src/database/queries/stats';

launch(async (emit) => {
  const db = new Database(config.pgConnString);

  while (true) {
    console.clear();

    try {
      const stats = await HourlyStats(
        db,
        new Date(Date.now() - 7200000),
        new Date(Date.now() + 3600000),
      );

      emit(stats);
    } catch (error) {
      console.error(error);
    }

    await delay(1000);
  }
});
