import branca from 'branca';
import { keccak256 } from 'js-sha3';

export type Branca = {
  encode(buffer: Uint8Array, timestamp?: number): string;
  decode(token: string, ttl?: number): Uint8Array;
  timestamp(token: string): number;
};

export default function createBranca(secret: string): Branca {
  const instance = branca(Buffer.from(keccak256.arrayBuffer(secret)));

  return {
    encode: (buffer, timestamp) => instance.encode(buffer as any, timestamp),
    decode: (token, ttl) => new Uint8Array(instance.decode(token, ttl).buffer),
    timestamp: (token) => instance.timestamp(token),
  };
}
