import { describe, expect, test } from "vitest";
import { multishot } from "./index";

describe("multishot generator tests", () => {
  test("basic functionality", () => {
    function* testGen() {
      yield 1;
      yield 2;
      return 3;
    }

    const multi = multishot(testGen);
    const gen1 = multi();

    expect(gen1[0].value).toBe(1);

    const gen2 = gen1[1]!(undefined);
    expect(gen2[0].value).toBe(2);

    const gen3 = gen2[1]!(undefined);
    expect(gen3[0].value).toBe(3);
    expect(gen3[0].done).toBeTruthy();
  });

  test("continuation from a previous yield point", () => {
    function* testGen() {
      yield 1;
      yield 2;
      return 3;
    }

    const multi = multishot(testGen);
    const gen1 = multi();

    // Create a continuation from the first yield point
    const continuation = gen1[1]!;

    continuation(undefined);

    // Continue from the second yield point
    const gen2 = continuation(undefined);
    expect(gen2[0].value).toBe(2);

    const gen3 = gen2[1]!(undefined);
    expect(gen3[0].value).toBe(3);
    expect(gen3[0].done).toBeTruthy();
  });

  test("multiple continuations from the same yield point", () => {
    function* testGen() {
      yield "a";
      yield "b";
      return "c";
    }

    const multi = multishot(testGen);
    const gen1 = multi();

    const cont1 = gen1[1]!;
    const cont2 = gen1[1]!;

    // Continue with the first continuation
    const gen2a = cont1(undefined);
    expect(gen2a[0].value).toBe("b");

    // Independently continue with the second continuation
    const gen2b = cont2(undefined);
    expect(gen2b[0].value).toBe("b");

    // Continue both to completion
    const gen3a = gen2a[1]!(undefined);
    const gen3b = gen2b[1]!(undefined);
    expect(gen3a[0].value).toBe("c");
    expect(gen3b[0].value).toBe("c");
  });

  test("complex scenario with different input values", () => {
    function* testGen() {
      const a = yield "first";
      const b = yield a;
      return b;
    }

    const multi = multishot(testGen);
    const gen1 = multi();

    const cont1 = gen1[1]!("x")[1]!;
    const cont2 = gen1[1]!("y")[1]!;

    const gen2a = cont1("z");
    const gen2b = cont2("w");

    expect(gen2a[0].value).toBe("z");
    expect(gen2b[0].value).toBe("w");
  });
});
