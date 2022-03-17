import { keccak256 } from 'js-sha3';

export default function UnsubscribeCode(
  secret: string,
  email: string,
) {
  return keccak256(JSON.stringify([secret, email]));
}
