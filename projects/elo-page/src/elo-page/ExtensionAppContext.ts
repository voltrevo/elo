import * as React from 'react';

import ExtensionAppClient from './ExtensionAppClient';

type ExtensionApp = ReturnType<typeof ExtensionAppClient>;
const ExtensionAppContext = React.createContext<ExtensionApp>({} as ExtensionApp);

export default ExtensionAppContext;
