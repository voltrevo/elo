declare const setTimeout: (task: () => void, ms: number) => number;

export default function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
