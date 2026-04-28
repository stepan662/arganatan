import React, { RefObject, useRef } from "react";
import {
  createContext,
  useContextNoSubscribe,
  useContextSelector,
} from "./useContextSelector";

type SelectorType<StateType, ReturnType> = (state: StateType) => ReturnType;

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

export const createProvider = <
  StateType,
  Actions,
  ProviderProps extends React.PropsWithChildren,
>(
  controller: (
    props: ProviderProps,
  ) => [state: StateType, actions: Actions] | undefined | null | JSX.Element,
) => {
  const Context = createContext<[StateType, Actions]>(null as any);

  const Provider: React.FC<ProviderProps> = ({ children, ...props }) => {
    const result = controller(props as any);
    const resultIsArray = Array.isArray(result);

    const [state, _actions] = resultIsArray ? result : [];
    const actionsRef = useRef(_actions as Actions | undefined);
    const stableActionsRef = useRef(undefined as Actions | undefined);

    if (!resultIsArray) {
      return <>{result}</>;
    }

    actionsRef.current = _actions;

    // stable actions
    stableActionsRef.current = createStableActions(
      actionsRef,
      stableActionsRef.current,
    );

    return (
      <Context.Provider value={[state!, stableActionsRef.current!]}>
        {children}
      </Context.Provider>
    );
  };

  const useActions = () => {
    return useContextNoSubscribe(Context)[1];
  };
  const useStateContext = function <SelectorReturn>(
    selector: SelectorType<StateType, SelectorReturn>,
  ) {
    return useContextSelector(Context, (value) => selector(value[0]));
  };

  return [Provider, useActions, useStateContext] as const;
};
