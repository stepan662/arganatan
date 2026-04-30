import { RefObject, useRef } from "react";

export type ActionMap = {
  [key: string]: ((...args: any[]) => any) | ActionMap;
};

export function createStableActions<
  A extends NonNullable<ActionMap> | undefined,
>(actionsRef: RefObject<A | undefined>): A | undefined {
  if (!actionsRef.current) {
    return actionsRef.current ?? undefined;
  }
  const wrap = (currentObj: ActionMap, path: string[] = []): ActionMap => {
    const stableNode: ActionMap = {};

    Object.keys(currentObj).forEach((key) => {
      const value = currentObj[key];
      const currentPath = [...path, key];

      if (typeof value === "function") {
        stableNode[key] = (...args: any[]) => {
          const latestFn = currentPath.reduce(
            (acc, k) => (acc as any)?.[k],
            actionsRef.current,
          ) as Function | undefined;

          return latestFn?.(...args);
        };
      } else if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        stableNode[key] = wrap(value as ActionMap, currentPath);
      } else {
        throw new Error(
          `[react-arven] Invalid action at "${currentPath.join(".")}". Only functions/objects.`,
        );
      }
    });

    return stableNode!;
  };

  return wrap(actionsRef.current!) as A;
}

export function useStableActions<A extends NonNullable<ActionMap> | undefined>(
  actions: A,
): A {
  const currentActionsRef = useRef(actions);
  const stableActionsRef = useRef<A>();

  currentActionsRef.current = actions;

  // stable actions
  if (!stableActionsRef.current) {
    stableActionsRef.current = createStableActions(currentActionsRef);
  }

  return stableActionsRef.current!;
}
