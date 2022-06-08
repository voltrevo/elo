export default async function runForever(): Promise<never> {
  await new Promise(() => {});
  throw new Error('Should never reach here');
}
