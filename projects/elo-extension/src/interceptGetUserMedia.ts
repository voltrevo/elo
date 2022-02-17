export default function interceptGetUserMedia(
  onIntercept: (args: {
    constraints: MediaStreamConstraints,
    streamPromise: Promise<MediaStream>,
  }) => void,
) {
  // new
  (() => {
    const originalGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = (...args) => {
      const [constraints] = args;

      if (constraints === undefined) {
        return originalGum(...args);
      }

      const streamPromise = originalGum(...args);

      onIntercept({ constraints, streamPromise });

      return streamPromise;
    };
  })();

  // old
  (() => {
    const originalGum = (navigator as any).getUserMedia.bind(navigator);

    (navigator as any).getUserMedia = (...args: any[]) => {
      const [constraints, successCallback, errorCallback] = args;

      if (constraints === undefined) {
        return originalGum(...args);
      }

      const streamPromise = new Promise<MediaStream>((resolve, reject) => {
        originalGum(
          constraints,
          (stream: MediaStream) => {
            resolve(stream);
            successCallback(stream);
          },
          (error: Error) => {
            reject(error);
            errorCallback(error);
          },
        );
      });

      onIntercept({ constraints, streamPromise });

      return streamPromise;
    };
  })();
}
