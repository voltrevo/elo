import { keccak_256 } from "js-sha3";

export default function hardenPassword(
  password: string,
  salt: string,
  iterations: number,
) {
  let value = JSON.stringify([password, salt]);

  for (let i = 0; i < iterations; i++) {
    value = keccak_256(value);
  }

  return value;
}
