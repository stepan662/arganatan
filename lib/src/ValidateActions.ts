type ERROR_ACTIONS_MUST_BE_FUNCTIONS_OR_OBJECTS =
  "❌ react-arven: Actions must be functions or objects";
type ERROR_NO_ARRAYS = "❌ react-arven: No arrays in actions";

// Recursive validator
export type ValidateActions<T> =
  | undefined
  | (T extends (...args: any[]) => any
      ? T // Is it a function? Okay.
      : T extends any[]
        ? ERROR_NO_ARRAYS
        : T extends object
          ? { [K in keyof T]: ValidateActions<T[K]> } // Is it an object? Check nested keys.
          : ERROR_ACTIONS_MUST_BE_FUNCTIONS_OR_OBJECTS); // Everything else is an error.
