/** Options for `throttle` */
export interface Options {
  /** If it's set to `true` and queue isn't empty, the function is executed again at the end.
   *
   * default: `false`
   */
  trailing: boolean;
}
/** Result of `throttle` */
export interface Result<U> {
  /** whether the provided function is executed */
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
): (...parameters: T) => Promise<Result<U>> {
  const { trailing = false } = options ?? {};
  let queue: Queue<T, U> | undefined;
  let running = false;
  const cancel = () => queue?.resolve?.({ executed: false });

  const runNext = async () => {
    if (running || !queue) {
      return;
    }
    running = true;
    const { parameters, resolve, reject } = queue;
    queue = undefined;
    try {
      const result = await callback(...parameters);

      running = false;
      resolve({ result, executed: true });
    } catch (e) {
      running = false;
      reject(e);
    } finally {
      if (trailing) {
        await runNext();
      } else {
        cancel();
        await Promise.resolve();
      }
    }
  };

  return (...parameters: T) =>
    new Promise<Result<U>>((resolve, reject) => {
      queue?.resolve?.({ executed: false });
      queue = { parameters, resolve, reject };
      runNext();
    });
}
