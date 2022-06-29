import DeviceStorage from "../elo-extension-app/deviceStorage/DeviceStorage";

export default function handleZoomSpecialActivation(
  deviceStorage: DeviceStorage,
) {
  let state = '';

  window.addEventListener('keydown', evt => {
    if (evt.key === 'Shift') {
      state = '';
    } else if (evt.shiftKey) {
      state += evt.key;
    }
  });

  window.addEventListener('keyup', evt => {
    if (evt.key !== 'Shift') {
      return;
    }

    if (state === 'ZOOM') {
      (async () => {
        const root = await deviceStorage.readRoot();

        const zoomSpecialActivation = root.zoomSpecialActivation
          ? undefined
          : true;

        await deviceStorage.writeRoot({ ...root, zoomSpecialActivation });

        alert(`Zoom special preview features have been turned ${
          zoomSpecialActivation ? 'ON' : 'OFF'
        }`);
      })();
    }

    state = '';
  });
}
