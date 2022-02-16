/* eslint-disable camelcase */

import type { Feedback } from '../feedbackHandler';
import PgClient from './PgClient';
import ReconnectablePgClient from './ReconnectablePgClient';

export default class DbClient {
  reconnectablePgClient: ReconnectablePgClient;

  constructor(pgConnString: string) {
    this.reconnectablePgClient = new ReconnectablePgClient(pgConnString);
  }

  private PgClient(): Promise<PgClient> {
    return this.reconnectablePgClient.PgClient();
  }

  async disconnect() {
    await this.reconnectablePgClient.disconnect();
  }

  async insertFeedback(userId: string | undefined, feedback: Feedback, now = new Date()) {
    const pgClient = await this.PgClient();

    await pgClient.query(
      `
        INSERT INTO feedback (
          time_,
          user_id,
          version_,
          content
        ) VALUES (
          $1,
          $2,
          $3,
          $4
        )
      `,
      [
        now.toISOString(),
        userId,
        1,
        feedback,
      ],
    );
  }
}
