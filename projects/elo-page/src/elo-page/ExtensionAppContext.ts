import * as React from 'react';

import ExtensionAppClient from './ExtensionAppClient';

type ContentApp = ReturnType<typeof ExtensionAppClient>;
const ExtensionAppContext = React.createContext<ContentApp>({} as ContentApp);

export default ExtensionAppContext;
