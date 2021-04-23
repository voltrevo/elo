import assert from "./assert";

export default function assertExists<T>(value: T): Exclude<T, null | undefined> {
  assert(value !== null && value !== undefined);
  return value as Exclude<T, null | undefined>;
}
