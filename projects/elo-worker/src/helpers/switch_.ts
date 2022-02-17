export default function switch_<T>(options: [boolean, T][], default_: T) {
  for (const [condition, value] of options) {
    if (condition) {
      return value;
    }
  }

  return default_;
}
