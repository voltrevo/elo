import EloPageContext from "./EloPageContext";

export default function syncPageAndHash(pageCtx: EloPageContext) {
  window.addEventListener('hashchange', () => {
    if (location.hash.slice(1) !== pageCtx.state.page) {
      pageCtx.update({ page: location.hash.slice(1) });
    }
  });

  pageCtx.events.on('update', () => {
    if (pageCtx.state.page !== location.hash.slice(1)) {
      location.hash = pageCtx.state.page;
    }
  });
}
