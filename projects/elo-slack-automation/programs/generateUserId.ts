import crypto from 'crypto';

import { generateChecksum } from '../src/elo-slack-automation/validateUserId';
import base58 from '../src/common-pure/base58';
import loadConfig from '../src/elo-slack-automation/loadConfig';

(async () => {
  const config = await loadConfig();
  const randomData = crypto.randomBytes(16);

  const userIdBuf = new Uint8Array(20);
  userIdBuf.set(randomData, 0);
  userIdBuf.set(generateChecksum(config.userIdGenerationSecret, randomData), 16);
  
  console.log(base58.encode(userIdBuf));
})();
