import { keccak256 } from 'js-sha3';

export default function hashPassword(
  hardenedPassword: string,
  salt: string,
) {
  return keccak256(`${hardenedPassword}:${salt}`);
}
