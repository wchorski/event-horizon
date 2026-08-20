export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function debouncePerField<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return (key: string, ...args: Parameters<T>) => {
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      timers.delete(key);
      fn(...args);
    }, delay);

    timers.set(key, timer);
  };
}