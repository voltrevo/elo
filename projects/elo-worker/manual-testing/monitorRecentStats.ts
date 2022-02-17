/* eslint-disable no-console */

import DbClient from '../src/database/DbClient';
import config from '../src/elo-worker/helpers/serverConfig';
import delay from '../src/common-pure/delay';
import launch from '../src/elo-worker/helpers/launch';

launch(async (emit) => {
  const db = new DbClient(config.pgConnString);

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
