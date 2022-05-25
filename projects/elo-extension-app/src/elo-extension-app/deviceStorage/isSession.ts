import SessionStats from "../../elo-types/SessionStats";

export default function isSession(value: unknown): value is SessionStats {
  const keys = [
    'title',
    'start',
    'end',
    'speakingTime',
  ];

  return keys.every(k => k in (value as any));
}
