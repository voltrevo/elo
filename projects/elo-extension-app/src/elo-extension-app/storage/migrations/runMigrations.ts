import assert from "../../../common-pure/assert";
import IRawStorage from "../IRawStorage";
import storageVersion from "../storageVersion";
import from0To1 from "./from0To1";

const migrations = [
  from0To1,
];

assert(migrations.length === storageVersion);

export default async function runMigrations(rawStorage: IRawStorage) {
  const root = (await rawStorage.get('elo'))['elo'];

  if (root === undefined) {
    // No need to migrate if nothing has been written yet
    return;
  }

  let currentVersion = root.storageVersion ?? 0;

  while (currentVersion < storageVersion) {
    await migrations[currentVersion](rawStorage);
    currentVersion++;
  }
}
