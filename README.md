# Multishot Generator

The `multishot-generator` package provides a unique implementation of multishot generators in TypeScript. This implementation allows generators to be "forked" at any yield point, creating new generators that can continue independently from that point. It is particularly useful in scenarios where you need to explore different paths of execution from a certain state in a generator function.

## Features

- **Efficient Forking**: Create new generator instances at any yield point with minimal overhead (No fork, no replay).
- **History Tracking**: Maintains a history of yielded values for accurate state replication.
- **Pure Generators**: Assumes generator functions are pure for consistent behavior across forks.

## Installation

To install the package, run the following command in your project directory:

```bash
npm install multishot-generator
```

## API Reference

### `multishot<T, TReturn, TNext>(generatorFn: () => Generator<T, TReturn, TNext>): () => MultishotGenerator<T, TReturn, TNext>`

Creates a multishot generator function.

- **`generatorFn`**: A generator function that will be used to create new generator instances.
- **Returns**: A function that, when called, initiates the multishot generator process. This function returns a `MultishotGenerator` union.

### `MultishotGenerator<T, TReturn, TNext>`

The `MultishotGenerator` type is a union of a tuple representing the state of a multishot generator at a specific point in its execution. It can be either of the following:

1. **A Tuple for Yielded Values**: When the generator yields a value, the `MultishotGenerator` is a tuple of the form `[IteratorYieldResult<T>, NextFunction]`. This tuple consists of:
   - **`IteratorYieldResult<T>`**: An object with a `value` property containing the yielded value of type `T`, and a `done` property which is `false`.
   - **`NextFunction`**: A function with the signature `(value: TNext) => MultishotGenerator<T, TReturn, TNext>`. This function is used to continue or fork the generator's execution with a new value of type `TNext`.

2. **A Tuple for Returned Values**: When the generator completes its execution, the `MultishotGenerator` is a tuple of the form `[IteratorReturnResult<TReturn>]`. This tuple consists of:
   - **`IteratorReturnResult<TReturn>`**: An object with a `value` property containing the final return value of type `TReturn`, and a `done` property which is `true`.

The `MultishotGenerator` type allows users to manage the execution of a generator, providing the capability to either continue the generator with a new value or to handle its completion.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs, feature requests, or improvements.

## License

This project is licensed under the [MIT License](LICENSE).