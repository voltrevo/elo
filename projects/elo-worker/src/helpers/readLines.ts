export default async function readLines(
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
) {
  const reader = stream.getReader();

  const textDecoder = new TextDecoder();
  const buf = new Uint8Array(4 * 1024 * 1024); // TODO: Handle lines exceeding this length
  let bufPos = 0;
  const lineBreakCode = '\n'.charCodeAt(0);

  while (true) {
    const { done, value } = await reader.read();

    if (value) {
      buf.set(value, bufPos);
      let bufReadStart = 0;
      let bufSearchStart = bufPos;
      bufPos += value.length;

      while (true) {
        const lineBreakOffset = buf.subarray(bufSearchStart, bufPos).indexOf(lineBreakCode);

        if (lineBreakOffset === -1) {
          break;
        }

        const lineBreakPos = bufSearchStart + lineBreakOffset;
        const lineBuf = buf.subarray(bufReadStart, lineBreakPos);
        bufReadStart = lineBreakPos + 1;
        bufSearchStart = lineBreakPos + 1;

        onLine(textDecoder.decode(lineBuf));
      }

      buf.copyWithin(0, bufReadStart, bufPos);
      bufPos -= bufReadStart;
    }

    if (done) {
      break;
    }
  }

  if (bufPos > 0) {
    onLine(textDecoder.decode(buf.subarray(0, bufPos)));
  }
}
