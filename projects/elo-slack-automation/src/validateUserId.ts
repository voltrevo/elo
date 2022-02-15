import { keccak256 } from 'js-sha3';

import base58 from './helpers/base58';
import * as config from './config';

export default function validateUserId(userId: string) {
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

function generateChecksum(data: Uint8Array) {
  const hash = keccak256.create();
  hash.update(config.userIdGenerationSecret);
  hash.update(data);

  return new Uint8Array(hash.arrayBuffer().slice(0, 4));
}
