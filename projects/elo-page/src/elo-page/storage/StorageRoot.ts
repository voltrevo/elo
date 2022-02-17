type StorageRoot = {
  lastSessionKey?: string;
  metricPreference?: string;
  userId?: string;
  installTriggered?: true;
  registrationData?: {
    userId: string;
    email: string;
    passwordHash?: string;
  };
};

function StorageRoot(): StorageRoot {
  return {};
}

export default StorageRoot;
