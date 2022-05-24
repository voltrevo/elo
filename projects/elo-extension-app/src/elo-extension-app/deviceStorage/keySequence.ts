import { keccak256 } from 'js-sha3';

import base58 from '../../common-pure/base58';

export default function keySequence(userId: string, sequenceName: string, index: number) {
  const hashInput = JSON.stringify([userId, sequenceName, index]);
  
  const buf = new Uint8Array(
    keccak256.update(hashInput).arrayBuffer()
  );
  
  return base58.encode(buf);
}
