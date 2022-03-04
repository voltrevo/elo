/* eslint-disable camelcase */

import PgClient from './PgClient';
import ReconnectablePgClient from './ReconnectablePgClient';

export default class DbClient {
  reconnectablePgClient: ReconnectablePgClient;

  constructor(pgConnString: string) {
    this.reconnectablePgClient = new ReconnectablePgClient(pgConnString);
  }

  PgClient(): Promise<PgClient> {
    return this.reconnectablePgClient.PgClient();
  }

  async disconnect() {
    await this.reconnectablePgClient.disconnect();
  }
}
