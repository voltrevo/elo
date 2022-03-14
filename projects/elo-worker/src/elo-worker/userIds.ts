import crypto from 'crypto';

import { keccak256 } from 'js-sha3';

import base58 from '../common-pure/base58';

// TODO: Inject this
import config from './helpers/config';

function generateChecksum(data: Uint8Array) {
  const hash = keccak256.create();
  hash.update(config.userIdGenerationSecret);
  hash.update(data);

  return new Uint8Array(hash.arrayBuffer().slice(0, 4));
}

export function generateUserId(seed?: string): string {
  let randomData: Uint8Array;

  if (seed !== undefined) {
    const hash = keccak256.create();
    hash.update('for randomData');
    hash.update(config.userIdGenerationSecret);
    hash.update(seed);
    randomData = new Uint8Array(hash.arrayBuffer().slice(0, 16));
  } else {
    randomData = crypto.randomBytes(16);
  }

  const userIdBuf = new Uint8Array(20);
  userIdBuf.set(randomData, 0);
  userIdBuf.set(generateChecksum(randomData), 16);

  return base58.encode(userIdBuf);
}

export function validateUserId(userId: string) {
  let userIdBuf: Uint8Array;

  try {
    userIdBuf = new Uint8Array(base58.decode(userId));
  } catch {
    return false;
  }

  if (userIdBuf.length !== 20) {
    return false;
  }

  const checksum = generateChecksum(userIdBuf.slice(0, 16));

  if (checksum.some((byte, i) => userIdBuf[16 + i] !== byte)) {
    return false;
  }

  return true;
}
