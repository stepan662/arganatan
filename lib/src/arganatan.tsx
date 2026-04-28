import React, { RefObject, useDebugValue, useRef } from "react";
import {
  createContext,
  useContextSelector,
  useStoreContext,
} from "./useContextSelector";
import { ValidateActions } from "./ValidateActions";
import { ActionMap, createStableActions } from "./createStableActions";

type SelectorType<S, R> = (state: S) => R;

export type ReturnType<S, A> = {
  state: S;
  actions: A;
};

type ExtractControllerData<T> = T extends {
  state: infer S;
  actions: infer A extends ActionMap;
}
  ? { state: S; actions: A }
  : never;

export function createProvider<
  ProviderProps,
  R extends
    | { state: any; actions: any }
    | React.ReactElement
    | null
    | undefined,
>(
  controller: (
    props: ProviderProps,
  ) => R &
    (R extends { actions: infer A }
      ? { actions: ValidateActions<A> }
      : unknown),
  defaultEqualityFn: (a: any, b: any) => boolean = Object.is,
) {
  type Data = ExtractControllerData<R>;
  type StateType = Data["state"];
  type ActionsType = Data["actions"];

  const Context = createContext<{
    state: StateType;
    actions: ActionsType;
  }>();

  const Provider: React.FC<React.PropsWithChildren<ProviderProps>> = ({
    children,
    ...props
  }) => {
    const result = controller(props as any);
    const state =
      (result as Partial<ReturnType<StateType, ActionsType>>)?.state ||
      undefined;
    const _actions =
      (result as Partial<ReturnType<StateType, ActionsType>>)?.actions ||
      undefined;
    if (!state || !_actions) {
      return <>{result}</>;
    }

    const actionsRef = useRef(_actions as ActionsType | undefined);
    const stableActionsRef = useRef(undefined as ActionsType | undefined);

    actionsRef.current = _actions;

    // stable actions
    stableActionsRef.current = createStableActions(
      actionsRef,
      stableActionsRef.current,
    );

    const actions = actionsRef.current;

    const value = { state, actions };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useActions = () => {
    return useStoreContext(Context).value.actions;
  };

  const useStateContext = function <SelectorReturn>(
    selector: SelectorType<StateType, SelectorReturn>,
    equalityFn: (a: any, b: any) => boolean = defaultEqualityFn,
  ) {
    const prevValue = React.useRef<SelectorReturn>();

    const stableSelector = React.useCallback(
      (contextValue: any) => {
        const state = contextValue.state;
        const newValue = selector(state);

        if (equalityFn(prevValue.current, newValue)) {
          return prevValue.current as SelectorReturn;
        }

        prevValue.current = newValue;
        return newValue;
      },
      [selector, equalityFn],
    );

    return useContextSelector(Context, stableSelector);
  };

  return [Provider, useActions, useStateContext] as const;
}
