import * as React from 'react';

import ExtensionAppClient from './ExtensionAppClient';

type ContentApp = ReturnType<typeof ExtensionAppClient>;
const ContentAppContext = React.createContext<ContentApp>({} as ContentApp);

export default ContentAppContext;
