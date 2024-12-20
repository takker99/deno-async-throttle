import { assertEquals, assertRejects } from "@std/assert";
import { throttle, type ThrottledState } from "./mod.ts";

Deno.test("throttle", async (t) => {
  let callCount = 0;
  const fn = (arg: number, state: ThrottledState) => {
    callCount++;
    return `${arg}-${state}`;
  };
  const throttledFn = throttle(fn);
  await t.step("immediate execution", async () => {
    callCount = 0;

    assertEquals(await throttledFn(1), "1-immediate");
    assertEquals(callCount, 1);
    await throttledFn.ready;
  });

  await t.step("delayed execution", async () => {
    callCount = 0;

    const promises = Array.from({ length: 2 }).map((_, i) => throttledFn(i));
    assertEquals(await Promise.all(promises), ["0-immediate", "1-delayed"]);
    assertEquals(callCount, 2);
    await throttledFn.ready;
  });

  await t.step("discarded execution", async () => {
    callCount = 0;
    const throttledFn = throttle(fn, { maxQueued: 1 });

    const promises = Array.from({ length: 4 }).map((_, i) => throttledFn(i));
    assertEquals(await Promise.all(promises), [
      "0-immediate",
      "1-discarded",
      "2-delayed",
      "3-delayed",
    ]);
    assertEquals(callCount, 4);
    await throttledFn.ready;
  });

  await t.step("error handling", async () => {
    const fn = (arg: number, state: ThrottledState) => {
      if (arg === 1) throw new Error("Test error");
      return `${arg}-${state}`;
    };

    const throttledFn = throttle(fn, { maxQueued: 3 });

    const promises = Array.from({ length: 3 }).map((_, i) => throttledFn(i));
    await throttledFn.ready;
    assertEquals(await promises[0], "0-immediate");
    await assertRejects(() => promises[1], Error, "Test error");
    assertEquals(await promises[2], "2-delayed");
  });
});
