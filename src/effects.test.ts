import { describe, it, expect } from "vitest";
import { run, handle, getOp } from "./effects";

const id = getOp("id");
const io = getOp("io");

describe("algebraic effects...", () => {
  it("id handler", () => {
    // id effect does nothing but return the payload
    const data = Math.random();
    const v: number = run(function* () {
      return yield* handle(function* () {
        return yield* id(data);
      }).withDefaultReturn({
        id: function* (val, cont) {
          return yield* cont(val);
        },
      });
    });
    expect(v).toBe(data);
  });

  type StateType = number;

  const get = getOp("get")<StateType>;
  const set = getOp("set")<StateType>;

  it("state", () => {
    const g = handle(function* () {
      const v = yield* get();
      yield* set(v * 2);
      return yield* get();
    }).with(
      function* (val) {
        return function* (__) {
          return val;
        };
      },
      {
        get: function* (__, cont) {
          return function* (s) {
            // yield* io(()=>console.log("this line makes type check fail"));
            const f = yield* cont(s);
            return yield* f(s);
          };
        },
        set: function* (payload, cont) {
          return function* (__) {
            const f = yield* cont();
            return yield* f(payload);
          };
        },
      }
    );
    const w = run(() => g);
    const f = run(() => w(10));
    expect(f).toBe(20);
  });

  it("pickall", () => {
    const decide = getOp("decide");
    function* choose(a: number, b: number) {
      return (yield* decide()) ? a : b;
    }
    const g = () =>
      handle(function* () {
        const a = yield* choose(15, 30);
        const b = yield* choose(5, 10);
        return a - b;
      }).with(
        function* (val) {
          return [val];
        },
        {
          decide: function* (_, cont) {
            const t = yield* cont(true);
            const f = yield* cont(false);
            return [...t, ...f];
          },
        }
      );
    expect(run(g)).toEqual([10, 5, 25, 20]);
  });
});

declare module "./effects" {
  interface Effects<T> {
    print: Effect<string, void>;
    id: Effect<T, T>;
    read: Effect<undefined, string>;
    raise: Effect<string, never>;
    get: Effect<void, T>;
    set: Effect<T, void>;
    decide: Effect<void, boolean>;
    await: Effect<Promise<T>, T>;
  }
}
