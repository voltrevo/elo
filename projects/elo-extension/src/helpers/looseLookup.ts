export default function looseLookup(obj: unknown, key: string) {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  try {
    return (obj as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}
