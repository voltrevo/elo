import type WebSocket from 'ws';

export default function wsDataToUint8Array(data: WebSocket.Data): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (Array.isArray(data)) {
    const len = data.map(b => b.length).reduce((a, b) => a + b);
    const buf = new Uint8Array(len);
    let pos = 0;

    for (const dataBuf of data) {
      buf.set(dataBuf, pos);
      pos += dataBuf.length;
    }

    return buf;
  }

  if (data instanceof Buffer) {
    return data;
  }

  throw new Error('Unexpected websocket data');
}
