import assert from "../../../common-pure/assert";
import IRawDeviceStorage from "../IRawDeviceStorage";
import deviceStorageVersion from "../deviceStorageVersion";
import from0To1 from "./from0To1";

const migrations = [
  from0To1,
];

assert(migrations.length === deviceStorageVersion);

export default async function runMigrations(rawStorage: IRawDeviceStorage) {
  const root = (await rawStorage.get('elo'))['elo'];

  if (root === undefined) {
    // No need to migrate if nothing has been written yet
    return;
  }

  let currentVersion = root.storageVersion ?? 0;

  while (currentVersion < deviceStorageVersion) {
    await migrations[currentVersion](rawStorage);
    currentVersion++;
  }
}
