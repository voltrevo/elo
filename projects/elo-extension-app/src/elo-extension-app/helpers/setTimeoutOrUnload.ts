export default function setTimeoutOrUnload(fn: () => void, delay: number) {
  let onBeforeUnload = () => { fn(); };

  window.addEventListener('beforeunload', onBeforeUnload);

  return setTimeout(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    fn();
  }, delay);
}
