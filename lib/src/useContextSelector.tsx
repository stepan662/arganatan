import {
  createContext as createContextOrig,
  useContext as useContextOrig,
  useDebugValue,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

type Store<T> = {
  value: T;
  subscribe: (listener: () => any) => () => any;
  notify: () => void;
};

interface StoreContext<T> {
  Provider: React.Provider<T>;
  Consumer: React.Consumer<Store<T>>;
}

export function createContext<T>(defaultValue: T): StoreContext<T> {
  const context = createContextOrig<Store<T>>(undefined as any);
  const ProviderOrig = context.Provider;
  // @ts-expect-error
  context.Provider = ({
    value,
    children,
  }: {
    value: T;
    children: React.ReactNode;
  }) => {
    const storeRef = useRef<Store<T>>();
    let store = storeRef.current;
    if (!store) {
      const listeners = new Set<() => any>();
      store = {
        value,
        subscribe: (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        notify: () => listeners.forEach((l) => l()),
      };
      storeRef.current = store;
    }
    useEffect(() => {
      if (!Object.is(store.value, value)) {
        store.value = value;
        store.notify();
      }
    });
    return <ProviderOrig value={store}>{children}</ProviderOrig>;
  };
  return context as StoreContext<T>;
}

export function useContextSelector<T, X>(
  context: StoreContext<T>,
  selector: (value: T) => X,
) {
  const store = useContextOrig(context as React.Context<Store<T>>);
  const selected = useSyncExternalStore(store.subscribe, () =>
    selector(store.value),
  );
  useDebugValue("ArganatanSelector");
  return selected;
}

export function useStoreContext<T>(context: StoreContext<T>): Store<T> {
  const store = useContextOrig(context as React.Context<Store<T>>);
  return store;
}
