type StorageRoot = {
  lastSessionKey?: string;
  metricPreference?: string;
  userId?: string;
  installTriggered?: true;
  email?: string;
};

function StorageRoot(): StorageRoot {
  return {};
}

export default StorageRoot;
