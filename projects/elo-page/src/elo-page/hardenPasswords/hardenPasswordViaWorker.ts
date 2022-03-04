export default async function hardenPasswordViaWorker(
  domain: string,
  userId: string,
  password: string,
  iterations: number,
) {
  const worker = new Worker('/hardenPasswordWorker.bundle.js');

  worker.postMessage([domain, userId, password, iterations]);

  const result = await new Promise((resolve, reject) => {
    worker.onmessage = (evt => {
      if ('error' in evt.data) {
        reject(evt.data.error);
        return;
      }

      if (typeof evt.data.value !== 'string') {
        reject(new Error(`Unexpected reply from worker: ${evt.data}`));
        return;
      }

      resolve(evt.data.value);
    });
  });

  return result;
}
