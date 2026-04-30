// copied from https://github.com/pmndrs/zustand/blob/main/src/vanilla/shallow.ts

const isIterable = (obj: object): obj is Iterable<unknown> =>
  Symbol.iterator in obj;

const hasIterableEntries = (
  value: Iterable<unknown>,
): value is Iterable<unknown> & {
  entries(): Iterable<[unknown, unknown]>;
} =>
  // HACK: avoid checking entries type
  "entries" in value;

const compareEntries = (
  valueA: { entries(): Iterable<[unknown, unknown]> },
  valueB: { entries(): Iterable<[unknown, unknown]> },
) => {
  const mapA = valueA instanceof Map ? valueA : new Map(valueA.entries());
  const mapB = valueB instanceof Map ? valueB : new Map(valueB.entries());
  if (mapA.size !== mapB.size) {
    return false;
  }
  for (const [key, value] of mapA) {
    if (!mapB.has(key) || !Object.is(value, mapB.get(key))) {
      return false;
    }
  }
  return true;
};

// Ordered iterables
const compareIterables = (
  valueA: Iterable<unknown>,
  valueB: Iterable<unknown>,
) => {
  const iteratorA = valueA[Symbol.iterator]();
  const iteratorB = valueB[Symbol.iterator]();
  let nextA = iteratorA.next();
  let nextB = iteratorB.next();
  while (!nextA.done && !nextB.done) {
    if (!Object.is(nextA.value, nextB.value)) {
      return false;
    }
    nextA = iteratorA.next();
    nextB = iteratorB.next();
  }
  return !!nextA.done && !!nextB.done;
};

/**
 * Performs a shallow equality comparison between two values.
 *
 * Primitives are compared with `Object.is`. For objects it checks one level
 * deep: plain objects and Map/Set-like iterables compare entries, ordered
 * iterables (e.g. arrays) compare items by position. Values of different
 * prototypes are always considered unequal.
 *
 * Useful as an `equalityFn` for `useStateContext` when your selector returns a
 * new object/array each render but its contents haven't changed.
 */
export function shallow<T>(valueA: T, valueB: T): boolean {
  if (Object.is(valueA, valueB)) {
    return true;
  }
  if (
    typeof valueA !== "object" ||
    valueA === null ||
    typeof valueB !== "object" ||
    valueB === null
  ) {
    return false;
  }
  if (Object.getPrototypeOf(valueA) !== Object.getPrototypeOf(valueB)) {
    return false;
  }
  if (isIterable(valueA) && isIterable(valueB)) {
    if (hasIterableEntries(valueA) && hasIterableEntries(valueB)) {
      return compareEntries(valueA, valueB);
    }
    return compareIterables(valueA, valueB);
  }
  // assume plain objects
  return compareEntries(
    { entries: () => Object.entries(valueA) },
    { entries: () => Object.entries(valueB) },
  );
}
