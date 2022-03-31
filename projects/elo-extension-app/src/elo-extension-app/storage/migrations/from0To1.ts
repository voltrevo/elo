import IRawStorage from '../IRawStorage';

export default async function from0To1(rawStorage: IRawStorage) {
  const root = await rawStorage.get('elo');
  const userId = root.userId;

  if (typeof userId === 'string') {
    const allItems = await rawStorage.get();
    const newItems: Record<string, any> = {};

    for (const k of Object.keys(allItems)) {
      const value = allItems[k];

      if (isSession(value) && value.userId === undefined) {
        value.userId = userId;
        newItems[k] = value;
      }
    }

    await rawStorage.set(newItems);
  }
}

function isSession(value: any) {
  const keys = [
    'title',
    'start',
    'end',
    'speakingTime',
  ]

  return keys.every(k => k in value);
}
