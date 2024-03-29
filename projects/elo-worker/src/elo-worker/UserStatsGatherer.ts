/* eslint-disable no-console */

import { incUserSpeakingHoursPct, incUserStreamHoursPct } from '../database/queries/stats';
import { AnalysisFragment } from '../elo-types/Analysis';
import AppComponents from './AppComponents';

const hour = 3600;
const reportingThreshold = 0.01 * hour;

export default class UserStatsGatherer {
  userId: string;
  db: AppComponents['db'];

  streamSeconds = 0;
  speakingSeconds = 0;

  constructor(userId: string, { db }: AppComponents<'db'>) {
    this.userId = userId;
    this.db = db;
  }

  async process(fragment: AnalysisFragment) {
    try {
      if (fragment.type !== 'progress') {
        return;
      }

      this.streamSeconds += fragment.value.audio_time;
      this.speakingSeconds += fragment.value.speaking_time;

      const promises: Promise<unknown>[] = [];

      while (this.streamSeconds >= reportingThreshold) {
        promises.push(incUserStreamHoursPct(this.db, this.userId));
        this.streamSeconds -= reportingThreshold;
      }

      while (this.speakingSeconds >= reportingThreshold) {
        promises.push(incUserSpeakingHoursPct(this.db, this.userId));
        this.speakingSeconds -= reportingThreshold;
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(error);
    }
  }
}
