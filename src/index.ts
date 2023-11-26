class HistoryNode<T> {
  constructor(
    public readonly prev: null | HistoryNode<T>,
    public readonly value: T
  ) {}
}

const EMPTY:unique symbol = {} as any; // unique reference

class Unique<T> {
  constructor(private _value: T | typeof EMPTY, private holding = true) {}

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

export type MultishotGenerator<T, TReturn, TNext> =
  | [
      IteratorYieldResult<T>,
      next: (value: TNext) => MultishotGenerator<T, TReturn, TNext>
    ]
  | [IteratorReturnResult<TReturn>];

const replay: <T, TReturn, TNext>(
  h: HistoryNode<TNext> | null,
  gen: Generator<T, TReturn, TNext>
) => undefined = (h, gen) =>
  h ? (replay(h.prev, gen), gen.next(h.value), undefined) : undefined;

export function multishot<T, TReturn, TNext>(
  createGenerator: () => Generator<T, TReturn, TNext>
): () => MultishotGenerator<T, TReturn, TNext> {
  function step(
    generatorInstance: Unique<Generator<T, TReturn, TNext>>,
    latestCall: HistoryNode<TNext>
  ): MultishotGenerator<T, TReturn, TNext> {
    const currentGenerator = generatorInstance.value;
    const transfered = generatorInstance.transfer(); // should tranfer the ownership first
    // now generatorInstance is empty!
    const result = currentGenerator.next(latestCall.value);

    if (result.done === true) {
      return [result];
    }

    return [
      result,
      (value) =>
        step(
          transfered.getOrCreate(() => {
            const gen = createGenerator();
            replay(latestCall, gen); // dfs: risk of stack overflow
            return gen;
          }),
          new HistoryNode(latestCall, value)
        ),
    ];
  }

  return () =>
    step(new Unique(createGenerator()), new HistoryNode(null, undefined!));
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
