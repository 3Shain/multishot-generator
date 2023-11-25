import { multishot, oneshot } from "./index";

export function getOp(effect) {
  return function* op(payload) {
    return yield {
      effect,
      payload,
    };
  };
}

function __withHandler(handler, handling) {
  const [result, next] = handling;
  if (result.done === true) {
    return handler.return(result.value);
  } else {
    const { effect, payload } = result.value;
    if (effect in handler) {
      return handler[effect](payload, (y) => __withHandler(handler, next(y)));
    } else {
      return [result.value, (y) => __withHandler(handler, next(y))];
    }
  }
}

export function handle(handling) {
  return {
    with(returnHandler, effectHandlers) {
      const mg = multishot(handling);
      return oneshot(
        __withHandler(
          Object.fromEntries([
            [
              "return",
              (retVal) => {
                return multishot(() => returnHandler(retVal))();
              },
            ],
            ...Object.entries(effectHandlers).map(([key, val]) => {
              return [
                key,
                (payload, cont) => {
                  return multishot(() =>
                    val(payload, (y) => oneshot(cont(y)))
                  )();
                },
              ];
            }),
          ]),
          mg()
        )
      );
    },
    withDefaultReturn(effectHandlers) {
      const mg = multishot(handling);
      return oneshot(
        __withHandler(
          Object.fromEntries([
            ["return", (retVal) => [{ done: true, value: retVal }]],
            ...Object.entries(effectHandlers).map(([key, val]) => {
              return [
                key,
                (payload, cont) => {
                  return multishot(() =>
                    val(payload, (y) => oneshot(cont(y)))
                  )();
                },
              ];
            }),
          ]),
          mg()
        )
      );
    },
  };
}

export function run(generator) {
  const mg = multishot(generator);
  let [result, next] = mg();
  while (result.done !== true) {
    const { effect, payload } = result.value;
    if (effect === "io") {
      [result, next] = next(payload());
    } else if (effect === "fail") {
      throw new Error(`computation failed!`);
    } else {
      throw new Error(`Unhandled effect: ${effect}`);
    }
  }
  return result.value;
}
