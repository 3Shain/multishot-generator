export type Effect<Payload, Resume> = {
  payload: Payload;
  resume: Resume;
};

interface Effects<T> {
  io: Effect<() => T, T>;
}

type EffectTypes = keyof Effects<any>;

export function getOp<E extends EffectTypes>(
  effect: E
): <T>(
  payload: Effects<T>[E]["payload"]
) => Generator<E, Effects<T>[E]["resume"]>;

type GeneratorFnEffects<T> = T extends (
  ...args: any[]
) => Generator<infer Eff, any, any>
  ? Eff
  : never;

export type Cont<T = unknown, R = unknown> = (val: T) => Generator<never, R>;

export function handle<T, TReturn>(
  fn: () => Generator<T, TReturn>
): {
  with: <
    R,
    TReturEffect,
    THandler extends {
      [Key in EffectTypes]?: <TPayload>(
        payload: Effects<TPayload>[Key]["payload"],
        cont: Cont<Effects<TPayload>[Key]["resume"], R>
      ) => Generator<EffectTypes, R>;
    }
  >(
    returnHandler: (val: TReturn) => Generator<TReturEffect, R>,
    effectHandlers: THandler
  ) => Generator<
    | Exclude<T, keyof THandler>
    | TReturEffect
    | GeneratorFnEffects<THandler[keyof THandler]>,
    R
  >;
  withDefaultReturn: <
    THandler extends {
      [Key in EffectTypes]?: <TPayload>(
        payload: Effects<TPayload>[Key]["payload"],
        cont: Cont<Effects<TPayload>[Key]["resume"], TReturn>
      ) => Generator<EffectTypes, TReturn>;
    }
  >(
    effectHandlers: THandler
  ) => Generator<
    Exclude<T, keyof THandler> | GeneratorFnEffects<THandler[keyof THandler]>,
    TReturn
  >;
};

export function run<T>(fn: () => Generator<"io" | "fail", T>): T;
