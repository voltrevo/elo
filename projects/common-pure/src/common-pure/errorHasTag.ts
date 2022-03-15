import looseLookup from './looseLookup';

export default function errorHasTag(error: unknown, tag: string) {
  if (!/^[a-z-]*$/.test(tag)) {
    throw new Error(`Invalid tag ${tag}`);
  }

  const message = looseLookup(error, 'message');

  if (typeof message !== 'string') {
    return false;
  }

  const rx = new RegExp(`#${tag}\\b`);

  return rx.test(message);
}
