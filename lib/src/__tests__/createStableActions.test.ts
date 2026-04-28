import { describe, test, expect, vi } from "vitest";
import { createStableActions, ActionMap } from "../createStableActions";

type CounterActions = {
  increment: () => number;
  decrement?: () => number;
};

type NestedActions = {
  counter: {
    increment: () => number;
    decrement: () => number;
  };
};

type TestActions = {
  test: () => string;
};

describe("createStableActions", () => {
  test("returns cached actions if provided", () => {
    const cached: ActionMap = { test: () => {} };
    const result = createStableActions({ current: undefined }, cached);
    expect(result).toBe(cached);
  });

  test("returns undefined if no actionsRef.current", () => {
    const result = createStableActions({ current: undefined }, undefined);
    expect(result).toBeUndefined();
  });

  test("creates stable actions for functions", () => {
    const actions: CounterActions = {
      increment: vi.fn(() => 1),
    };
    const actionsRef = { current: actions };
    const stable = createStableActions(actionsRef, undefined);
    expect(stable).toBeDefined();
    expect(typeof stable!.increment).toBe("function");

    stable!.increment();
    expect(actions.increment).toHaveBeenCalled();
  });

  test("creates stable actions for nested objects", () => {
    const actions: NestedActions = {
      counter: {
        increment: vi.fn(() => 1),
        decrement: vi.fn(() => -1),
      },
    };
    const actionsRef = { current: actions };
    const stable = createStableActions(actionsRef, undefined);
    expect(stable).toBeDefined();
    expect(typeof stable!.counter.increment).toBe("function");

    stable!.counter.increment();
    expect(actions.counter.increment).toHaveBeenCalled();
  });

  test("stable actions use latest from ref", () => {
    const initialActions: TestActions = { test: vi.fn(() => "initial") };
    const actionsRef = { current: initialActions };
    const stable = createStableActions(actionsRef, undefined);

    const newActions: TestActions = { test: vi.fn(() => "updated") };
    actionsRef.current = newActions;

    stable!.test();
    expect(newActions.test).toHaveBeenCalled();
    expect(initialActions.test).not.toHaveBeenCalled();
  });
});
