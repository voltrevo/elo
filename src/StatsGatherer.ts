/* eslint-disable no-console */

import { AnalysisFragment } from './analyze';
import DbClient from './database/DbClient';

const hour = 3600;
const reportingThreshold = 0.01 * hour;

export default class StatsGatherer {
  streamSeconds = 0;
  speakingSeconds = 0;

  constructor(
    public db: DbClient,
  ) {}

  async process(fragment: AnalysisFragment) {
    try {
      if (fragment.type !== 'progress') {
        return;
      }

      this.streamSeconds += fragment.value.audio_time;
      this.speakingSeconds += fragment.value.speaking_time;

      const promises: Promise<unknown>[] = [];

      while (this.streamSeconds >= reportingThreshold) {
        promises.push(this.db.incStreamsPct());
        this.streamSeconds -= reportingThreshold;
      }

      while (this.speakingSeconds >= reportingThreshold) {
        promises.push(this.db.incSpeakersPct());
        this.speakingSeconds -= reportingThreshold;
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(error);
    }
  }
}
