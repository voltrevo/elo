export default new Promise<void>((resolve) => {
  function checkReadyState() {
    if (document.readyState === 'complete') {
      resolve();
      document.removeEventListener('readystatechange', checkReadyState);
    }
  }

  document.addEventListener('readystatechange', checkReadyState);
  checkReadyState();
});
