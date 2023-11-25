class HistoryNode<T> {
  constructor(
    public readonly prev: null | HistoryNode<T>,
    public readonly value: T
  ) {}
}

const EMPTY = Symbol.for("unique_empty");

class Unique<T> {
  private holding = true;

  constructor(private _value: T | typeof EMPTY) {}

  transfer(): Unique<T> {
    const ret = new Unique(this._value);
    this._value = EMPTY;
    this.holding = false;
    return ret;
  }

  getOrCreate(factory: () => T): Unique<T> {
    if (this.holding) {
      return this;
    } else {
      return new Unique(factory());
    }
  }

  get value(): T {
    if (this._value === EMPTY) {
      throw new Error("Assertation failed: accessing an empty Unique.");
    }
    return this._value;
  }
}

type MultishotGenerator<T, TReturn, TNext> =
  | [
      IteratorYieldResult<T>,
      next: (value: TNext) => MultishotGenerator<T, TReturn, TNext>
    ]
  | [IteratorReturnResult<TReturn>];

export function multishot<T, TReturn, TNext>(
  generatorFn: () => Generator<T, TReturn, TNext>
): () => MultishotGenerator<T, TReturn, TNext> {
  function doNext(
    generatorInstance: Unique<Generator<T, TReturn, TNext>>,
    latestCall: null | HistoryNode<TNext>,
    next: TNext
  ): MultishotGenerator<T, TReturn, TNext> {
    const newHistory = new HistoryNode(latestCall, next);
    // const newResult = generatorInstance.value!.next(next);
    const currentGenerator = generatorInstance.value;
    const transfered = generatorInstance.transfer(); // should tranfer the ownership first
    const newResult = currentGenerator.next(next);

    if (newResult.done === true) {
      return [newResult];
    }

    return [newResult, getNext(transfered, newHistory)];
  }

  function getNext(
    generatorInstance: Unique<Generator<T, TReturn, TNext>>,
    latestCall: null | HistoryNode<TNext>
  ) {
    return function next(value: TNext): MultishotGenerator<T, TReturn, TNext> {
      return doNext(
        generatorInstance.getOrCreate(() => {
          let current = latestCall;
          let collected = [];
          while (current !== null) {
            collected.push(current);
            current = current.prev;
          }
          const newGeneratorInstance = generatorFn();
          while (collected.length) {
            newGeneratorInstance.next(collected.pop()!.value);
          }
          return newGeneratorInstance;
        }),
        latestCall,
        value
      );
    };
  }

  return () => {
    const generatorInstance = new Unique(generatorFn());
    return doNext(generatorInstance, null, undefined!);
  };
}

export function* oneshot<T, TReturn, TNext>(
  generator: MultishotGenerator<T, TReturn, TNext>
): Generator<T, TReturn, TNext> {
  while (true) {
    const [result, next] = generator;
    if (result.done === true) {
      return result.value;
    } else {
      generator = next!(yield result.value);
    }
  }
}

export * from "./effects";