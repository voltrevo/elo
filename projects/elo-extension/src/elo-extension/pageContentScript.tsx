import * as ReactDOM from 'react-dom';
import { ThirdPartyExtensionAppClient } from '../elo-page/ExtensionAppClient';
import { ThirdPartyExtensionAppContext } from '../elo-page/ExtensionAppContext';

import PostMessageClient from '../elo-page/helpers/PostMessageClient';
import App from './components/App';
import connectGetUserMedia from './connectGetUserMedia';

const eloExtension = document.querySelector('#elo-extension')!;

const container = document.createElement('div');
container.style.display = 'none';
eloExtension.appendChild(container);

const contentApp = ThirdPartyExtensionAppClient(new PostMessageClient('elo'));

ReactDOM.render(
  <ThirdPartyExtensionAppContext.Provider value={contentApp}>
    <App/>
  </ThirdPartyExtensionAppContext.Provider>,
  container,
);

connectGetUserMedia(container, contentApp);
