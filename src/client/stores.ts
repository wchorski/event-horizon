type Listener<T> = (state: T) => void;
type Selector<T, S> = (state: T) => S;

type Store<T extends object> = {
  get: () => T;
  set: (state: T) => void;
  patch: (partial: Partial<T>) => void;
  update: (fn: (state: T) => T) => void;
  subscribe: (listener: Listener<T>) => () => void;
  // new
  select: <S>(selector: Selector<T, S>, listener: Listener<S>) => () => void;
};

export function createStore<T extends object>(initialData: T): Store<T> {
  let state = initialData;
  const listeners = new Set<Listener<T>>();

  const notify = () => listeners.forEach((fn) => fn(state));

  return {
    get() {
      return state;
    },
    set(newState) {
      state = newState;
      notify();
    },
    patch(partial) {
      state = { ...state, ...partial };
      notify();
    },
    update(fn) {
      state = fn(state);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },

    // Only calls listener when the selected slice actually changes
    select<S>(selector: Selector<T, S>, listener: Listener<S>) {
      let prev = selector(state);
      listener(prev);

      const unsubscribe = this.subscribe((newState) => {
        const next = selector(newState);
        if (!Object.is(prev, next)) {
          prev = next;
          listener(next);
        }
      });

      return unsubscribe;
    },
  };
}

/** USAGE
 * // Only rerenders when groups array reference changes
  timelineStore.select(
    (s) => s.groups,
    (groups) => renderGroupList(groups)
  );

  // Only rerenders when moments change
  timelineStore.select(
    (s) => s.moments,
    (moments) => renderMomentList(moments)
  );

  // Only rerenders when a specific moment changes
  timelineStore.select(
    (s) => s.moments.find(m => m.id === momentId),
    (moment) => renderMoment(moment)
  );
 */
