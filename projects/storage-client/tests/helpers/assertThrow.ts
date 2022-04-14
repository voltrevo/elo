import assert from "../../src/common-pure/assert";

export default async function assertThrow(fn: () => unknown) {
  try {
    await fn();
  } catch {
    return;
  }

  assert(false);
}
