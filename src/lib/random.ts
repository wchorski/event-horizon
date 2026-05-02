export function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomSubset<T>(arr: readonly T[], max: number): T[] {
  const count = randomInt(0, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDate(range: { start: Date; end: Date }) {
  const START_RANGE = range.start.getTime();
  const END_RANGE = range.end.getTime();
  const ts = randomInt(START_RANGE, END_RANGE);
  return new Date(ts);
}
