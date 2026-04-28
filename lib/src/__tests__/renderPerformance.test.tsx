import React, { act } from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createProvider } from "../arganatan";

describe("render performance", () => {
  test("no unnecessary re-renders on unrelated state change", () => {
    let countRenders = 0;
    let otherRenders = 0;

    const [Provider, useActions, useStateContext] = createProvider(() => {
      const [count, setCount] = React.useState(0);
      const [other, setOther] = React.useState("unchanged");

      return {
        state: { count, other },
        actions: { setCount, setOther },
      };
    });

    const CountComponent = () => {
      countRenders++;
      const count = useStateContext((s) => s.count);
      return <div>Count: {count}</div>;
    };

    const OtherComponent = () => {
      otherRenders++;
      const other = useStateContext((s) => s.other);
      return <div>Other: {other}</div>;
    };

    const ControlComponent = () => {
      const { setOther } = useActions();
      return <button onClick={() => setOther("updated")}>Update other</button>;
    };

    render(
      <Provider>
        <CountComponent />
        <OtherComponent />
        <ControlComponent />
      </Provider>,
    );

    countRenders = 0;
    otherRenders = 0;

    act(() => {
      screen.getByRole("button").click();
    });

    expect(countRenders).toBe(0);
    expect(otherRenders).toBe(1);
  });

  test("re-renders only when selected state changes", () => {
    let countRenders = 0;
    let otherRenders = 0;

    const [Provider, useActions, useStateContext] = createProvider(() => {
      const [count, setCount] = React.useState(0);
      const [other, setOther] = React.useState("test");

      return {
        state: { count, other },
        actions: { setCount, setOther },
      };
    });

    const CountComponent = () => {
      countRenders++;
      const count = useStateContext((s) => s.count);
      return <div>Count: {count}</div>;
    };

    const OtherComponent = () => {
      otherRenders++;
      const other = useStateContext((s) => s.other);
      return <div>Other: {other}</div>;
    };

    const ControlComponent = () => {
      const { setCount } = useActions();
      return (
        <button onClick={() => setCount((prev) => prev + 1)}>
          Update count
        </button>
      );
    };

    render(
      <Provider>
        <CountComponent />
        <OtherComponent />
        <ControlComponent />
      </Provider>,
    );

    countRenders = 0;
    otherRenders = 0;

    act(() => {
      screen.getByRole("button").click();
    });

    expect(countRenders).toBe(1);
    expect(otherRenders).toBe(0);
  });

  test("actions are stable references", () => {
    let firstActions: any;
    let stableRef: any;

    const [Provider, useActions] = createProvider(() => {
      const [count, setCount] = React.useState(0);
      return {
        state: { count },
        actions: { setCount },
      };
    });

    const ActionComponent = () => {
      const actions = useActions();
      if (!firstActions) firstActions = actions;
      stableRef = actions;
      return (
        <button onClick={() => actions.setCount((prev: number) => prev + 1)}>
          Increment
        </button>
      );
    };

    render(
      <Provider>
        <ActionComponent />
      </Provider>,
    );

    act(() => {
      screen.getByRole("button").click();
    });

    expect(stableRef).toBe(firstActions);
  });
});
