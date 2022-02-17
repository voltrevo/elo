/* eslint-disable no-console */

import { AnalysisFragment } from '../elo-types/Analysis';
import AppComponents from './AppComponents';

const hour = 3600;
const reportingThreshold = 0.01 * hour;

export default class StatsGatherer {
  db: AppComponents['db'];

  streamSeconds = 0;
  speakingSeconds = 0;

  constructor({ db }: AppComponents<'db'>) {
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
