export default function buffersEqual(a: Uint8Array, b: Uint8Array) {
  const len = a.length;

  if (b.length !== len) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  
  return true;
}
