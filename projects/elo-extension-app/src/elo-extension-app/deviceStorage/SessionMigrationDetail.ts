import * as io from 'io-ts';

const SessionMigrationDetail = io.type({
  lastUsed: io.number,
  aggregationMigrated: io.boolean,
  sessionsMigrated: io.number,
  migrations: io.array(io.type({
    localSessionKey: io.string,
    remoteSessionId: io.string,
  })),
});

type SessionMigrationDetail = io.TypeOf<typeof SessionMigrationDetail>;

export default SessionMigrationDetail;
