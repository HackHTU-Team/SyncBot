/**
 * This file defines a type that can be either a single value or an array of values.
 * It is useful for functions that can accept either a single item or multiple items.
 * 
 * Example usage:
 * ```typescript
 * const single: SingleOrArray<string>[] = ["hello", ["world", "foo", "bar"]];
 * ```
 */
type SingleOrArray<T> = T | T[];
export default SingleOrArray;