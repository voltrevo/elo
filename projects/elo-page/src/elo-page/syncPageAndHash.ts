import EloPageContext from "./EloPageContext";

export default function syncPageAndHash(pageCtx: EloPageContext) {
  window.addEventListener('hashchange', () => {
    if (location.hash.slice(1) !== pageCtx.state.hash) {
      pageCtx.update({ hash: location.hash.slice(1) });
    }
  });

  pageCtx.events.on('update', () => {
    if (pageCtx.state.hash !== location.hash.slice(1)) {
      location.hash = pageCtx.state.hash;
    }
  });
}
