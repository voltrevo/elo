export default function shuffle<T>(values: T[], rand = Math.random): T[] {
  values = values.slice();

  for (let i = 0; i < values.length - 1; i++) {
    const j = i + Math.floor((values.length - i) * rand());
    [values[i], values[j]] = [values[j], values[i]];
  }

  return values;
}
