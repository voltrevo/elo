import * as React from 'react';

import ExtensionAppClient, { ThirdPartyExtensionAppClient } from './ExtensionAppClient';

type ExtensionApp = ReturnType<typeof ExtensionAppClient>;
const ExtensionAppContext = React.createContext<ExtensionApp>({} as ExtensionApp);

export type ThirdPartyExtensionApp = ReturnType<typeof ThirdPartyExtensionAppClient>;
export const ThirdPartyExtensionAppContext = React.createContext<ThirdPartyExtensionApp>({} as ThirdPartyExtensionApp);

export default ExtensionAppContext;
