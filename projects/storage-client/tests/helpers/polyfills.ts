const globalAny = globalThis as any;

globalAny.crypto ??= {
  getRandomValues: (buf: unknown) => {
    if (!(buf instanceof Uint8Array)) {
      throw new Error('bad/unimplemented input');
    }

    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.floor(256 * Math.random());
    }

    return buf;
  },
};
