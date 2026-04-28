import React, { RefObject, useRef } from "react";
import {
  createContext,
  useContextSelector,
  useStoreContext,
} from "./useContextSelector";

type SelectorType<S, R> = (state: S) => R;

export type ReturnType<S, A> = {
  state: S;
  actions: A;
};

const createStableActions = (actions: RefObject<any>, stableActions: any) => {
  if (actions.current && !stableActions) {
    const result: Record<string, Function> = {};
    Object.keys(actions.current).map((key) => {
      result[key] = (...args: any[]) =>
        (actions.current?.[key] as CallableFunction)?.(...args);
    });
    return result;
  } else {
    return stableActions;
  }
};

export const createProvider = <StateType, Actions, ProviderProps>(
  controller: ({
    children,
    ...props
  }: React.PropsWithChildren<ProviderProps>) =>
    | ReturnType<StateType, Actions>
    | undefined
    | null
    | JSX.Element,
) => {
  const Context = createContext<ReturnType<StateType, Actions>>(null as any);

  const Provider: React.FC<React.PropsWithChildren<ProviderProps>> = ({
    children,
    ...props
  }) => {
    const result = controller(props as any);
    const state =
      (result as Partial<ReturnType<StateType, Actions>>)?.state || undefined;
    const _actions =
      (result as Partial<ReturnType<StateType, Actions>>)?.actions || undefined;
    if (!state || !_actions) {
      return <>{result}</>;
    }

    const actionsRef = useRef(_actions as Actions | undefined);
    const stableActionsRef = useRef(undefined as Actions | undefined);

    actionsRef.current = _actions;

    // stable actions
    stableActionsRef.current = createStableActions(
      actionsRef,
      stableActionsRef.current,
    );

    const actions = actionsRef.current;

    return (
      <Context.Provider value={{ state, actions }}>{children}</Context.Provider>
    );
  };

  const useActions = () => {
    return useStoreContext(Context).value.actions;
  };

  const useStateContext = function <SelectorReturn>(
    selector: SelectorType<StateType, SelectorReturn>,
  ) {
    return useContextSelector(Context, (value) => selector(value.state));
  };

  return [Provider, useActions, useStateContext] as const;
};
