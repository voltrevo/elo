import looseLookup from "./looseLookup";

export default class PostMessageClient {
  nextId = 0;

  constructor(
    public channel: string,
  ) {}

  post(data: unknown): Promise<unknown> {
    const channel = this.channel;
    const id = this.nextId++;

    window.postMessage({ channel, id, data }, '*');

    return new Promise((resolve, reject) => {
      window.addEventListener('message', function messageListener(evt) {
        if (looseLookup(evt.data, 'channel') !== channel || evt.data.id !== id) {
          return;
        }

        const { result } = evt.data;

        if ('error' in result) {
          reject(result.error);
        } else {
          resolve(result.value);
        }
      });
    });
  }
}
