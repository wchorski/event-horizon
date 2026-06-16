// signals.ts

type Effect = () => void;

let activeEffect: Effect | null = null;

export function signal<T>(initialValue: T) {
  let value = initialValue;
  const subscribers = new Set<Effect>();

  return {
    get value() {
      // If an effect is currently running, it's depending on this signal
      if (activeEffect) subscribers.add(activeEffect);
      return value;
    },
    set value(next: T) {
      if (Object.is(value, next)) return;
      value = next;
      // Re-run all effects that read this signal
      for (const fn of subscribers) fn();
    },
  };
}

export function computed<T>(fn: () => T) {
  // A computed is just a signal whose value is derived from other signals
  const s = signal<T>(undefined as T);
  effect(() => {
    s.value = fn();
  });
  return {
    get value() {
      return s.value;
    },
  };
}

export function effect(fn: Effect) {
  const run = () => {
    activeEffect = run;
    try {
      fn();
    } finally {
      activeEffect = null;
    }
  };
  run();
}

export function untracked<T>(fn: () => T): T {
  const prev = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = prev;
  }
}

type CollectionChange<T> =
  | { type: "added"; item: T }
  | { type: "inserted"; item: T; index?: number }
  | { type: "removed"; id: number }
  | { type: "updated"; item: T; fromSelf: boolean }
  | { type: "reordered" };

export function collection<T extends { id: number }>(initial: T[]) {
  const items = signal<T[]>(initial);
  const change = signal<CollectionChange<T> | null>(null);

  return {
    get value() {
      return items.value;
    },

    add(item: T) {
      items.value = [...items.value, item];
      change.value = { type: "added", item };
    },
    insert(item: T, index?: number) {
      if (index === undefined) {
        items.value = [...items.value, item];
      } else {
        const next = [...items.value];
        next.splice(index, 0, item);
        items.value = next;
      }
      change.value = { type: "inserted", item, index };
    },
    remove(id: number) {
      items.value = items.value.filter((i) => i.id !== id);
      change.value = { type: "removed", id };
    },
    update(item: T, fromSelf = false) {
      items.value = items.value.map((i) => (i.id === item.id ? item : i));
      change.value = { type: "updated", item, fromSelf };
    },
    reorder() {
      change.value = { type: "reordered" };
    },
    onChange(fn: (change: CollectionChange<T>) => void) {
      effect(() => {
        const c = change.value;
        if (!c) return;
        fn(c);
      });
    },
  };
}
