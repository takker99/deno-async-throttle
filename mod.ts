/**
 * Represents the state of a {@linkcode ThrottledFn} call.
 *
 * - `immediate`: The function call is executed immediately.
 * - `delayed`: The function call is delayed and will be executed later.
 * - `discarded`: The function call is discarded and will not be executed.
 */
export type ThrottledState = "immediate" | "delayed" | "discarded";

/** An throttled function made by {@linkcode throttle} */
export interface ThrottledFn<Args extends readonly unknown[], R> {
  (...args: Args): Promise<R>;

  /**
   * A promise that resolves when the next call can be executed immediately
   * or `undefined` if any function is not currently throttled.
   */
  get ready(): Promise<void> | undefined;

  /**
   * Clears the throttle interval and calls all queued functions as discarded.
   *
   * @example
   * ```ts
   * import { assertEquals, assertRejects } from "@std/assert";
   *
   * const throttledFn = throttle(
   *   (i: number, state: ThrottledState) => `${i}-${state}`,
   *   { maxQueued: 3, interval: 100000 },
   * );
   *
   * const promises = Array.from({ length: 4 }).map((_, i) => throttledFn(i));
   * throttledFn.clear();
   * assertEquals(await promises[0], "0-immediate");
   * assertEquals(await promises[1], "1-discarded");
   * assertEquals(await promises[2], "2-discarded");
   * assertEquals(await promises[3], "3-discarded");
   * ```
   */
  clear(): void;
}

/** Options for {@linkcode throttle} */
export interface ThrottleOptions {
  /**
   * The interval in milliseconds to wait before allowing the next execution.
   * @default {0}
   */
  interval?: number;

  /**
   * The maximum number of tasks that can be queued while waiting for the interval.
   * If not specified, there will be no limit on the number of queued tasks.
   *
   * Excetuted tasks popped from the queue are passsed the state `delayed`.
   *
   * @default {Infinity}
   */
  maxQueued?: number;
}

/** Take a (async) function and make it enable to execute only once in {@linkcode ThrottleOptions.interval} interval.
 *
 * @example
 * ```ts
 * import { assertEquals, assertRejects } from "@std/assert";
 *
 * const throttledFn = throttle((i: number, state: ThrottledState) => {
 *   if (i === 1 && state !== "discarded") throw new Error("Test error");
 *   return `${i}-${state}`;
 * }, { maxQueued: 0 });
 *
 * assertEquals(await throttledFn(0), "0-immediate");
 * await throttledFn.ready;
 * await assertRejects(() => throttledFn(1), Error, "Test error");
 * await throttledFn.ready;
 * assertEquals(await throttledFn(2), "2-immediate");
 * await throttledFn.ready;
 *
 * const promises = Array.from({ length: 4 }).map((_, i) => throttledFn(i));
 * await throttledFn.ready;
 * assertEquals(await promises[0], "0-immediate");
 * assertEquals(await promises[1], "1-discarded");
 * assertEquals(await promises[2], "2-discarded");
 * assertEquals(await promises[3], "3-delayed");
 * assertEquals(await throttledFn(4), "4-immediate");
 * await throttledFn.ready;
 * assertEquals(await throttledFn(5), "5-immediate");
 * await throttledFn.ready;
 * ```
 *
 * @example
 * ```ts
 * import { assertEquals, assertRejects } from "@std/assert";
 *
 * const throttledFn = throttle((i: number, state: ThrottledState) => {
 *   if (i === 1) throw new Error("Test error");
 *   return `${i}-${state}`;
 * }, { maxQueued: 3 });
 *
 * const promises = Array.from({ length: 4 }).map((_, i) => throttledFn(i));
 * await throttledFn.ready;
 * assertEquals(await promises[0], "0-immediate");
 * await assertRejects(() => promises[1], Error, "Test error");
 * assertEquals(await promises[2], "2-delayed");
 * assertEquals(await promises[3], "3-delayed");
 * ```
 *
 * @param fn the async function to throttle
 * @param options options
 * @returns the throttled function
 */
export const throttle = <const Args extends readonly unknown[], const R>(
  fn: (
    this: ThrottledFn<Args, R>,
    ...args: [...Args, ThrottledState]
  ) => R | PromiseLike<R>,
  options?: ThrottleOptions,
): ThrottledFn<Args, R> => {
  const interval = options?.interval ?? 0;
  const maxQueued = options?.maxQueued ?? Infinity;
  let ready: Promise<void> | undefined;
  let clear: () => void;
  const queue: ((state: ThrottledState) => void)[] = [];

  const throttledFn: ThrottledFn<Args, R> = ((...args) => {
    if (!ready) {
      ready = (async () => {
        do {
          await new Promise<void>((resolve) => {
            const timeoutId = setTimeout(resolve, interval);
            clear = () => {
              clearTimeout(timeoutId);
              while (queue.length > 0) queue.shift()!("discarded");
              resolve();
            };
          });
          const execute = queue.pop();
          if (!execute) break;
          execute("delayed");
        } while (queue.length > 0);
        ready = undefined;
      })();
      return new Promise<R>((resolve) =>
        resolve(fn.call(throttledFn, ...args, "immediate"))
      );
    }
    while (queue.length > Math.max(maxQueued, 0)) queue.shift()!("discarded");
    const { promise, resolve, reject } = Promise.withResolvers<R>();
    queue.push(
      (state) => {
        try {
          resolve(fn.call(throttledFn, ...args, state));
        } catch (e) {
          reject(e);
        }
      },
    );
    return promise;
  }) as ThrottledFn<Args, R>;

  throttledFn.clear = () => {
    clear?.();
  };
  Object.defineProperty(throttledFn, "ready", {
    get: () => ready,
  });

  return throttledFn;
};
