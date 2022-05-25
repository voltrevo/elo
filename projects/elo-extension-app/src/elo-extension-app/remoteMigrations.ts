import assertExists from "../common-pure/assertExists";
import delay from "../common-pure/delay";
import nil from "../common-pure/nil";
import { initAggregateStats } from "../elo-types/AggregateStats";
import SessionStats from "../elo-types/SessionStats";
import accumulateStats from "./accumulateStats";
import AccountRoot from "./deviceStorage/AccountRoot";
import { RandomKey } from "./deviceStorage/DeviceStorage";
import DeviceStorageView from "./deviceStorage/DeviceStorageView";
import isSession from "./deviceStorage/isSession";
import SessionMigrationDetail from "./deviceStorage/SessionMigrationDetail";
import ExtensionApp, { AccountRootWithToken } from "./ExtensionApp";
import RemoteStorage from "./RemoteStorage";

let called = false;

export default async function remoteMigrations(
  app: ExtensionApp,
  accountRoot: AccountRootWithToken,
): Promise<AccountRootWithToken> {
  if (called) {
    return accountRoot;
  }

  called = true;

  accountRoot = await migrateSettings(app, accountRoot);
  accountRoot = await migrateSessions(app, accountRoot);

  return accountRoot;
}

const defaultRemoteMigrations: Exclude<AccountRoot['remoteMigrations'], nil> = {
  settings: undefined,
  sessions: undefined,
};

async function migrateSettings(
  app: ExtensionApp,
  accountRoot: AccountRootWithToken,
): Promise<AccountRootWithToken> {
  accountRoot.remoteMigrations ??= defaultRemoteMigrations

  if (!accountRoot.remoteMigrations.settings) {
    console.log('Migrating settings');

    app.remoteStorage ??= new RemoteStorage(
      await app.makeStorageClient(accountRoot.eloLoginToken),
    );

    const rs = app.remoteStorage;

    const remoteSettings = await rs.Settings().get();

    if (!remoteSettings) {
      await rs.Settings().set(accountRoot.settings);
    }

    accountRoot.remoteMigrations.settings = { stage: 'complete' };
    await app.writeAccountRoot(accountRoot);
  }

  return accountRoot;
}

async function migrateSessions(
  app: ExtensionApp,
  accountRoot: AccountRootWithToken,
): Promise<AccountRootWithToken> {
  accountRoot.remoteMigrations ??= defaultRemoteMigrations;

  if (!accountRoot.remoteMigrations.sessions) {
    console.log('Setting up incremental session migration');

    const detail: SessionMigrationDetail = {
      lastUsed: 0,
      aggregationMigrated: false,
      sessionsMigrated: 0,
      migrations: [],
    };

    app.remoteStorage ??= new RemoteStorage(
      await app.makeStorageClient(accountRoot.eloLoginToken),
    );

    const rs = app.remoteStorage;

    const deviceStorageView = new DeviceStorageView(app.deviceStorage);

    const wholeStorage = await deviceStorageView.rawDeviceStorageView.get();

    for (const [key, value] of Object.entries(wholeStorage)) {
      if (isSession(value) && value.userId === accountRoot.userId) {
        detail.migrations.push({
          localSessionKey: key,
          remoteSessionId: await rs.Sessions().ElementId(value.start),
        });
      }
    }

    detail.migrations.sort((a, b) => a.remoteSessionId > b.remoteSessionId ? -1 : 1);

    const detailKey = RandomKey();

    deviceStorageView.write(SessionMigrationDetail, detailKey, detail);
    
    accountRoot.remoteMigrations.sessions = {
      stage: 'in-progress',
      detailKey,
    };

    await app.writeAccountRoot(accountRoot, deviceStorageView);

    await deviceStorageView.commit();
  }

  if (accountRoot.remoteMigrations.sessions.stage === 'in-progress') {
    setTimeout(() => incrementalSessionMigration(app), 20_000);
  }

  return accountRoot;
}

async function incrementalSessionMigration(app: ExtensionApp) {
  console.log('Incremental session migration');

  let accountRoot = assertExists(await app.readAccountRoot());
  const sessionMigration = assertExists(accountRoot.remoteMigrations?.sessions);

  if (sessionMigration.stage !== 'in-progress') {
    return;
  }

  const rs = await app.requireRemoteStorage();

  const detailKey = sessionMigration.detailKey;
  const detail = assertExists(await app.deviceStorage.read(SessionMigrationDetail, detailKey));

  async function writeDetail() {
    detail.lastUsed = Date.now();
    await app.deviceStorage.write(SessionMigrationDetail, detailKey, detail);
  }

  if (Date.now() - detail.lastUsed < 60_000) {
    console.log('Avoiding concurrent incremental migration');
    return;
  }

  await writeDetail();

  if (!detail.aggregationMigrated) {
    const aggregateStats = (await rs.AggregateStats().get()) ?? initAggregateStats();

    for (const { localSessionKey } of detail.migrations) {
      const localSession = await app.deviceStorage.read(SessionStats, localSessionKey);

      if (localSession) {
        accumulateStats(aggregateStats, localSession);
      }
    }

    await rs.AggregateStats().set(aggregateStats);
    detail.aggregationMigrated = true;
    await writeDetail();
  }

  const sessions = rs.Sessions();

  for (
    const [iStr, { localSessionKey, remoteSessionId }] of
    Object.entries(detail.migrations).slice(detail.sessionsMigrated)
  ) {
    const i = Number(iStr);

    const localSession = await app.deviceStorage.read(SessionStats, localSessionKey);
    await sessions.Element(remoteSessionId).set(localSession);

    detail.sessionsMigrated = i + 1;
    await writeDetail();
    console.log(`Migrated ${i + 1}/${detail.migrations.length} sessions`);

    await delay(5_000);
  }

  accountRoot = assertExists(await app.readAccountRoot());
  assertExists(accountRoot.remoteMigrations).sessions = { stage: 'complete' };

  await app.writeAccountRoot(accountRoot);
}
