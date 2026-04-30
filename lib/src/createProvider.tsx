import React, { ReactNode, useRef } from "react";
import {
  createSelectableContext,
  useContextSelector,
  useStoreContext,
} from "./useContextSelector";
import { ValidateActions } from "./ValidateActions";
import { ActionMap, useStableActions } from "./useStableActions";

type SelectorType<S, R> = (state: S) => R;

export type ReturnType<S, A> = {
  state: S;
  actions: A;
};

export type EqualityFn = (a: any, b: any) => boolean;

type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };

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
  defaultEqualityFn: EqualityFn = Object.is,
) {
  type Data = ExtractControllerData<R>;
  type StateType = Data["state"];
  type ActionsType = Data["actions"];

  const Context = createSelectableContext<{
    state: StateType;
    actions: ActionsType;
  }>();

  const Provider = ({
    children,
    ...props
  }: PropsWithChildren<ProviderProps>): React.ReactElement | null => {
    const result = controller(props as any);

    const state =
      (result as Partial<ReturnType<StateType, ActionsType>>)?.state ??
      undefined;
    const _actions =
      (result as Partial<ReturnType<StateType, ActionsType>>)?.actions ??
      undefined;

    const actions = useStableActions(_actions);

    if (React.isValidElement(result) || result === null) {
      return result;
    }

    const value = { state, actions };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useActions = () => {
    return useStoreContext(Context)?.value?.actions;
  };

  const useStateContext = function <SelectorReturn>(
    selector: SelectorType<StateType, SelectorReturn>,
    equalityFn: EqualityFn = defaultEqualityFn,
  ) {
    const prevValue = React.useRef<SelectorReturn>();

    const stableSelector = React.useCallback(
      (contextValue: any) => {
        const state = contextValue?.state;
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
