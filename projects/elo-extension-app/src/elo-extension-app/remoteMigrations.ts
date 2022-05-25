import ExtensionApp, { AccountRootWithToken } from "./ExtensionApp";
import RemoteStorage from "./RemoteStorage";

export default async function remoteMigrations(
  app: ExtensionApp,
  accountRoot: AccountRootWithToken,
): Promise<AccountRootWithToken> {
  accountRoot = await migrateSettings(app, accountRoot);

  return accountRoot;
}

async function migrateSettings(
  app: ExtensionApp,
  accountRoot: AccountRootWithToken,
): Promise<AccountRootWithToken> {
  if (!accountRoot.remoteMigrations) {
    accountRoot.remoteMigrations = {
      settings: undefined,
    };
  }

  if (!accountRoot.remoteMigrations.settings) {
    console.log('Migrating settings');

    app.remoteStorage = new RemoteStorage(
      await app.makeStorageClient(accountRoot.eloLoginToken),
    );

    const rs = app.remoteStorage;

    const remoteSettings = await rs.Settings().get();

    if (!remoteSettings) {
      await rs.Settings().set(accountRoot.settings);
    }

    accountRoot.remoteMigrations.settings = true;
    await app.writeAccountRoot(accountRoot);
  }

  return accountRoot;
}
