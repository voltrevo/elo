type StorageRoot = {
  lastSessionKey?: string;
  metricPreference?: string;
  userId?: string;
};

function StorageRoot(): StorageRoot {
  return {};
}

export default StorageRoot;
