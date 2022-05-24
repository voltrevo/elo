import * as io from 'io-ts';

import optional from '../../elo-types/optional';

const Settings = io.type({
  liveStatsMode: io.string,
  experimentalZoomSupport: optional(io.literal(true)),
  zoomRedirectToWebClient: optional(io.boolean),
});

export default Settings;
