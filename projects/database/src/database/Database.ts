import { Client as PgClient } from 'pg';

export default class Database {
  private pgClientState?: {
    client: PgClient;
    connected: boolean;
    connectionPromise: Promise<void>;
  };

  constructor(private pgConnString: string) {}

  async PgClient(): Promise<PgClient> {
    if (this.pgClientState === undefined) {
      const client = new PgClient(this.pgConnString);

      const state: Database['pgClientState'] = {
        client,
        connected: false,
        connectionPromise: client.connect(),
      };

      state.connectionPromise.then(
        () => {
          state.connected = true;
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error(error);

          if (this.pgClientState === state) {
            this.pgClientState = undefined;
          }
        },
      );

      state.client.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error(error);

        if (this.pgClientState === state) {
          this.pgClientState = undefined;
        }
      });

      this.pgClientState = state;
    }

    if (!this.pgClientState.connected) {
      await this.pgClientState.connectionPromise;
    }

    const client = this.pgClientState?.client;

    if (client === undefined) {
      throw new Error('Database connection failed');
    }

    return client;
  }

  async disconnect() {
    const state = this.pgClientState;

    if (state === undefined) {
      return;
    }

    await state.client.end();

    if (this.pgClientState === state) {
      this.pgClientState = undefined;
    }
  }
}
