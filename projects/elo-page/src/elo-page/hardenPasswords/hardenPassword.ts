import { keccak_256 } from "js-sha3";

export default function hardenPassword(
  domain: string,
  userId: string,
  password: string,
  iterations: number,
) {
  let value = JSON.stringify([domain, userId, password]);

  for (let i = 0; i < iterations; i++) {
    value = keccak_256(value);
  }

  return value;
}
