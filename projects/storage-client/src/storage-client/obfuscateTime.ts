import { keccak256 } from 'js-sha3';

function lerp(a: number, x: number, b: number) {
  return a + x * (b - a);
}

function sigmoid01(x: number) {
  return 0.5 + 0.5 * x / (Math.abs(x) + 1);
}

function normRand(seed: string) {
  const buf = keccak256.arrayBuffer(seed);
  const vals = new Uint32Array(buf);

  const [u, v] = [
    vals[0] / (2 ** 32),
    vals[1] / (2 ** 32),
  ];

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function skewRand(seed: string) {
  return sigmoid01(normRand(seed));
}

function monotonicObfuscate01(seed: string, x: number) {
  let left = 0;
  let leftY = 0;
  let right = 1;
  let rightY = 1;
  let seq = '';

  while (right - left) {
    const mid = left + 0.5 * (right - left);

    if (left === mid || right === mid) {
      break;
    }

    const midY = lerp(
      leftY,
      skewRand(`${seed}:${seq}`),
      rightY,
    );

    if (x < mid) {
      seq += 'L';
      right = mid;
      rightY = midY;
    } else {
      seq += 'R';
      left = mid;
      leftY = midY;
    }
  }

  return lerp(leftY, (x - left) / (right - left), rightY);
}

function monotonicObfuscate(seed: string, x: number) {
  let base = Math.floor(x);

  function skewedBoundary(b: number) {
    return b + 0.5 * skewRand(`${seed}:skewedBoundary:${b}`) - 0.25;
  }

  let left = skewedBoundary(base);
  let right: number;

  if (left > x) {
    right = left;
    base--;
    left = skewedBoundary(base);
  } else {
    right = skewedBoundary(base + 1);

    if (right < x) {
      left = right;
      base++;
      right = skewedBoundary(base + 1);
    }
  }

  const progress = (x - left) / (right - left);

  return lerp(
    left,
    monotonicObfuscate01(`${seed}:${base}`, progress),
    right,
  );
}

export default function obfuscateTime(seed: string, t: number) {
  const segmentSize = 10 * 31_557_600_000; // 10 years
  const raw = segmentSize * monotonicObfuscate(seed, t / segmentSize);

  return 0.001 * t + 0.999 * raw;
}
