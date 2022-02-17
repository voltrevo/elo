export default function EloUrl(path: string) {
  const iconUrl = (document.getElementById('icon-template') as HTMLImageElement).src;
  const extensionBase = iconUrl.slice(0, iconUrl.indexOf('/assets/'));

  return `${extensionBase}/${path}`;
}
