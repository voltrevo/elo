import { keccak256 } from "js-sha3";

import obfuscateTime from "./obfuscateTime";
import Range from "../common-pure/Range";

export default function ObfuscatedTimeId(
  seed: string,
  t: number,
  trailValue = BigInt(`0x${keccak256(Range(5).map(() => Math.random()).join(''))}`),
) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwzyz';

  const expander = 2n ** 139n;

  let ot = BigInt(Math.floor(obfuscateTime(seed, t)));
  ot *= expander;
  ot += trailValue % expander;

  let result = '';

  for (let i = 0; i < 33; i++) {
    const digit = Number(ot % 58n);
    ot /= 58n;
    result = alphabet[digit] + result;
  }

  return result;
}
