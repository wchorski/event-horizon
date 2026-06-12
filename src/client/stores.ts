type Listener<T> = (state: T) => void;

type Store<T extends object> = {
  get: () => T;
  set: (state: T) => void;
  patch: (partial: Partial<T>) => void;
  update: (fn: (state: T) => T) => void;
  subscribe: (listener: Listener<T>) => () => void;
};

export function createStore<T extends object>(initialData: T): Store<T> {
  let state = initialData;
  const listeners = new Set<Listener<T>>();

  return {
    get() {
      return state;
    },

    set(newState: T) {
      state = newState;
      listeners.forEach((fn) => fn(state));
    },

    patch(partial: Partial<T>) {
      state = {
        ...state,
        ...partial,
      };
      listeners.forEach((fn) => fn(state));
    },

    update(fn: (state: T) => T) {
  state = fn(state);
  listeners.forEach((l) => l(state));
},

    subscribe(listener: Listener<T>) {
      listeners.add(listener);

      // immediately call with current state
      listener(state);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}