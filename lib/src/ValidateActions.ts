type ERROR_ACTIONS_MUST_BE_FUNCTIONS_OR_OBJECTS =
  "❌ Arganatan: Actions must be functions or objects";
type ERROR_NO_ARRAYS = "❌ Arganatan: No arrays in actions";

// Recursive validator
export type ValidateActions<T> = T extends (...args: any[]) => any
  ? T // Is it a function? Okay.
  : T extends any[]
    ? ERROR_NO_ARRAYS
    : T extends object
      ? { [K in keyof T]: ValidateActions<T[K]> } // Is it an object? Check nested keys.
      : ERROR_ACTIONS_MUST_BE_FUNCTIONS_OR_OBJECTS; // Everything else is an error.
