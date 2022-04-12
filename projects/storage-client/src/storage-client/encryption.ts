import aes from 'aes-js';

const blockSize = 16;

export function encrypt(key: Uint8Array, plaintext: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(blockSize));
  const cipher = new aes.ModeOfOperation.cbc(key, iv);

  const expandedPlaintextLen = blockSize * Math.ceil((plaintext.length + blockSize) / blockSize);
  const ignoreLen = expandedPlaintextLen - plaintext.length - blockSize;
  const expandedPlaintext = new Uint8Array(expandedPlaintextLen);
  expandedPlaintext[0] = ignoreLen;
  expandedPlaintext.set(plaintext, blockSize);

  const rawResult = cipher.encrypt(expandedPlaintext);

  const ciphertext = new Uint8Array(blockSize + rawResult.length);
  ciphertext.set(iv, 0);
  ciphertext.set(rawResult, blockSize);

  return ciphertext;
}

export function decrypt(key: Uint8Array, ciphertext: Uint8Array) {
  const iv = ciphertext.subarray(0, blockSize);
  const cipher = new aes.ModeOfOperation.cbc(key, iv);
  const expandedPlaintext = cipher.decrypt(ciphertext.subarray(blockSize));

  console.log({ expandedPlaintext });

  const ignoreLen = expandedPlaintext[0];

  if (ignoreLen > 15) {
    throw new Error('decryption failed');
  }

  for (let i = 1; i < 16; i++) {
    if (expandedPlaintext[i] !== 0) {
      throw new Error('decryption failed');
    }
  }

  return expandedPlaintext.subarray(16, expandedPlaintext.length - ignoreLen);
}
