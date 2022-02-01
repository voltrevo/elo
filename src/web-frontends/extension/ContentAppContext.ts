import * as React from 'react';

import ContentAppClient from './ContentAppClient';

type ContentApp = ReturnType<typeof ContentAppClient>;
const ContentAppContext = React.createContext<ContentApp>({} as ContentApp);

export default ContentAppContext;
