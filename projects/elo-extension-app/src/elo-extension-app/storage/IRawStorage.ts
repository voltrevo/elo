type IRawStorage = {
  get(key: string): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
};

export default IRawStorage;
