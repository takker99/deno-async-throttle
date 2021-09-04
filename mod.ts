import { sleep } from "./sleep.ts";

/** Options for `throttle` */
export interface Options {
  /** the amount of milliseconds to wait for after the previous function is finished
  *
  * the default value is `0` (no interval)
  */
  interval?: number;
  /** whether not to delay executing the first function for `interval`
   *
   * default: `true`
   */
  immediate?: boolean;
}
/** Result of `throttle` */
export interface Result<U> {
  /** whether the provided function is executed **/
  executed: boolean;
  /** the result of the provided function
  *
  * If the function is not executed, it is set to `undefined`
  */
  result?: U;
}

type Resolve<T> = (_value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;
type Queue<T, U> = {
  parameters: T;
  resolve: Resolve<Result<U>>;
  reject: Reject;
};

/** Make the async function execute only at a time
 *
 * @param callback the async function making execute only at a time
 * @param options options
 */
export function throttle<T extends unknown[], U>(
  callback: (..._args: T) => Promise<U>,
  options?: Options,
) {
  const { interval = 0, immediate = true } = options ?? {};
  let queue: Queue<T, U> | undefined;
  let running = false;
  const runNext = async () => {
    if (interval > 0) {
      await sleep(interval);
    }
    if (!queue) {
      running = false;
      return;
    }
    executeAsyncFunction(callback, queue);
    queue = undefined;
    await runNext();
  };
  const skipPrevFunction = (
    next: Queue<T, U>,
  ) => {
    queue?.resolve?.({ executed: false });
    queue = next;
  };
  return (...parameters: T) =>
    new Promise<Result<U>>((resolve, reject) => {
      const queue = { parameters, resolve, reject };
      if (running) {
        skipPrevFunction(queue);
        return;
      }
      running = true;
      (async () => {
        if (immediate) {
          await executeAsyncFunction(callback, queue);
        } else {
          skipPrevFunction(queue);
        }
        await runNext();
      })();
    });
}

async function executeAsyncFunction<T extends unknown[], U>(
  callback: (..._args: T) => Promise<U>,
  { parameters, resolve, reject }: Queue<T, U>,
) {
  try {
    resolve({ result: await callback(...parameters), executed: true });
  } catch (e) {
    reject(e);
  }
}
