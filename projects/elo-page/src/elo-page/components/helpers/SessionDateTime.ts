import SessionStats from "../../../elo-types/SessionStats";

export default function SessionDateTime(session: SessionStats) {
  const daysDiff = LocalDaysDifference(session.end, session.start);

  return [
    `${new Date(session.start).toDateString()},`,
    `${TimeOfDayStr(session.start)} - ${TimeOfDayStr(session.end)}`,
    ...(daysDiff > 0 ? [`(+${daysDiff}d)`] : []),
  ].join(' ');
}

function LocalDaysDifference(a: number, b: number) {
  const aDate = new Date(a);
  const bDate = new Date(b);

  aDate.setHours(0);
  bDate.setHours(0);

  return Math.round((aDate.getTime() - bDate.getTime()) / 86_400_000);
}

function TimeOfDayStr(unixTimeMs: number) {
  const date = new Date(unixTimeMs);

  const amPm = date.getHours() < 12 ? 'am' : 'pm';

  let displayHour = date.getHours() % 12;

  if (displayHour === 0) {
    displayHour = 12;
  }

  return `${displayHour}:${date.getMinutes().toString().padStart(2, '0')}${amPm}`;
}
