import looseLookup from './looseLookup';

export default class PostMessageServer {
  constructor(
    public channel: string,
    public handleRequest: (data: unknown) => unknown,
  ) {
    window.addEventListener('message', this.messageListener);
  }

  messageListener = async (evt: MessageEvent<any>) => {
    if (looseLookup(evt.data, 'channel') !== this.channel || !('request' in evt.data)) {
      return;
    }

    let response: { error: string } | { value: unknown };

    try {
      response = { value: await this.handleRequest(evt.data.request) };
    } catch (error) {
      response = { error: (error as Error).stack ?? '' };
    }

    window.postMessage({ channel: this.channel, id: evt.data.id, response }, '*');
  };

  close() {
    window.removeEventListener('message', this.messageListener);
  }
}
