import * as io from 'io-ts';

const ExtensionFeatureFlags = io.type({
  authEnabled: io.boolean,
  zoomRedirects: io.boolean,
  zoomExternalCapture: io.boolean,
});

type ExtensionFeatureFlags = io.TypeOf<typeof ExtensionFeatureFlags>;

export default ExtensionFeatureFlags;
