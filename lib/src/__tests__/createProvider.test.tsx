import { act } from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createProvider } from "../arganatan";

describe("createProvider", () => {
  test("renders provider and exposes state/actions", () => {
    const [Provider, useActions, useStateContext] = createProvider(() => ({
      state: { count: 0 },
      actions: { increment: vi.fn() },
    }));

    const TestComponent = () => {
      const count = useStateContext((s) => s.count);
      const actions = useActions();
      return (
        <div>
          <span>Count: {count}</span>
          <button onClick={actions.increment}>Increment</button>
        </div>
      );
    };

    render(
      <Provider>
        <TestComponent />
      </Provider>,
    );

    expect(screen.getByText("Count: 0")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  test("actions are callable", () => {
    const increment = vi.fn();
    const [Provider, useActions] = createProvider(() => ({
      state: { count: 0 },
      actions: { increment },
    }));

    const TestComponent = () => {
      const actions = useActions();
      return <button onClick={() => actions.increment(1)}>Increment</button>;
    };

    render(
      <Provider>
        <TestComponent />
      </Provider>,
    );

    act(() => {
      screen.getByRole("button").click();
    });

    expect(increment).toHaveBeenCalledWith(1);
  });

  test("nested actions work", () => {
    const nestedFn = vi.fn();
    const [Provider, useActions] = createProvider(() => ({
      state: { count: 0 },
      actions: { counter: { increment: nestedFn } },
    }));

    const TestComponent = () => {
      const actions = useActions();
      return (
        <button onClick={() => actions.counter.increment()}>Increment</button>
      );
    };

    render(
      <Provider>
        <TestComponent />
      </Provider>,
    );

    act(() => {
      screen.getByRole("button").click();
    });

    expect(nestedFn).toHaveBeenCalled();
  });
});
