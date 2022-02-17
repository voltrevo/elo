import looseLookup from './looseLookup';

export default class PostMessageClient {
  nextId = 0;

  constructor(
    public channel: string,
  ) {}

  post(request: unknown): Promise<unknown> {
    const channel = this.channel;
    const id = this.nextId++;

    window.postMessage({ channel, id, request }, '*');

    return new Promise((resolve, reject) => {
      window.addEventListener('message', function messageListener(evt) {
        if (
          looseLookup(evt.data, 'channel') !== channel ||
          evt.data.id !== id ||
          !('response' in evt.data)
        ) {
          return;
        }

        window.removeEventListener('message', messageListener);

        const { response } = evt.data;

        if ('error' in response) {
          reject(new Error(response.error));
        } else {
          resolve(response.value);
        }
      });
    });
  }
}
