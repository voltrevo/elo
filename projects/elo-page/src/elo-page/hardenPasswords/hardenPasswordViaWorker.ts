export default async function hardenPasswordViaWorker(
  password: string,
  salt: string,
  iterations: number,
) {
  const worker = new Worker('/hardenPasswordWorker.bundle.js');

  worker.postMessage([password, salt, iterations]);

  const result = await new Promise<string>((resolve, reject) => {
    worker.onmessage = (evt => {
      if ('error' in evt.data) {
        reject(evt.data.error);
        return;
      }

      const value = evt.data.value

      if (typeof value !== 'string') {
        reject(new Error(`Unexpected reply from worker: ${evt.data}`));
        return;
      }

      resolve(value);
    });
  });

  return result;
}
