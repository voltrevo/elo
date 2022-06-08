import launch from './helpers/launch';
import loadConfig from './loadConfig';

launch(async (emit) => {
  const config = await loadConfig();

  emit(config.startupMessage);
});
