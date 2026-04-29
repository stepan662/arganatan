import React, { useState, useEffect, useLayoutEffect } from "react";

// Select useLayoutEffect for the client and useEffect for the server to avoid warnings
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useSyncExternalStorePolyfill<S>(
  subscribe: (listener: () => void) => () => void,
  getSnapshot: () => S,
): S {
  const [state, setState] = useState(getSnapshot);

  useIsomorphicLayoutEffect(() => {
    let active = true;

    const checkUpdate = () => {
      if (!active) return;
      const nextState = getSnapshot();
      // Only trigger a re-render if the snapshot actually changed
      setState((prevState) =>
        Object.is(prevState, nextState) ? prevState : nextState,
      );
    };

    const unsubscribe = subscribe(checkUpdate);

    // Check for updates that might have happened between render and effect
    checkUpdate();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [subscribe, getSnapshot]);

  return state;
}

// Export the native one if it exists, otherwise the polyfill
export const useSyncExternalStore: typeof React.useSyncExternalStore =
  React.useSyncExternalStore || useSyncExternalStorePolyfill;
