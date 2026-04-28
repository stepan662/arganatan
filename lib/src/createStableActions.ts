import { RefObject } from "react";

export type ActionMap = {
  [key: string]: ((...args: any[]) => any) | ActionMap;
};

export function createStableActions<A extends ActionMap>(
  actionsRef: RefObject<A | undefined>,
  cachedStableActions: A | undefined,
): A | undefined {
  if (cachedStableActions || !actionsRef.current) return cachedStableActions;

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
          `[Arganatan] Invalid action at "${currentPath.join(".")}". Only functions/objects.`,
        );
      }
    });

    return stableNode as A;
  };

  return wrap(actionsRef.current) as A;
}
