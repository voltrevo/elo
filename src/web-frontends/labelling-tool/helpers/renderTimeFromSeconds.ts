export default function renderTimeFromSeconds(seconds: number) {
  const min = Math.floor(seconds / 60);

  if (min === 0) {
    return seconds.toFixed(3);
  }

  return `${min}:${(seconds - 60 * min).toFixed(3).padStart(6, '0')}`;
}
