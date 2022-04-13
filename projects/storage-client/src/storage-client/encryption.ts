import aes from 'aes-js';
import { keccak256 } from 'js-sha3';
import assert from '../common-pure/assert';
import buffersEqual from '../common-pure/buffersEqual';

const blockSize = 16;
const hashSize = 32;

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

export function encryptWithKeyHash(key: Uint8Array, plaintext: Uint8Array) {
  const ciphertext = encrypt(key, plaintext);

  const keyHash = bufferHash(key);
  const keyHashAndCiphertext = new Uint8Array(hashSize + ciphertext.length);
  keyHashAndCiphertext.set(keyHash, 0);
  keyHashAndCiphertext.set(ciphertext, hashSize);

  return keyHashAndCiphertext;
}

export function getKeyHash(keyHashAndCiphertext: Uint8Array) {
  return keyHashAndCiphertext.subarray(0, hashSize);
}

export function decryptWithKeyHash(key: Uint8Array, keyHashAndCiphertext: Uint8Array) {
  assert(buffersEqual(bufferHash(key), getKeyHash(keyHashAndCiphertext)));

  return decrypt(key, keyHashAndCiphertext.subarray(hashSize));
}

export function bufferHash(buf: Uint8Array) {
  return new Uint8Array(keccak256.arrayBuffer(buf));
}
