/* eslint-disable no-console */

import DbClient from '../src/database/DbClient';
import config from '../src/helpers/config';
import delay from '../src/helpers/delay';
import launch from '../src/helpers/launch';

launch(async (emit) => {
  const db = new DbClient(config.server.pgConnString);

  while (true) {
    console.clear();

    try {
      const stats = await db.HourlyStats(
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
