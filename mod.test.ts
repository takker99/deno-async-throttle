// the tests are based on https://github.com/shokai/async-throttle/blob/v0.2.1/test/index.js
import { Result, throttle } from "./mod.ts";
import { sleep } from "./sleep.ts";
import {
  beforeEach,
  describe,
  expect,
  it,
  run,
} from "https://deno.land/x/tincan@0.2.2/mod.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.114.0/testing/asserts.ts";

Deno.test("without arguments", async (t0) => {
  let results = [] as (Promise<Result<string>>[] | Result<string>[]);
  const makeCountUp = () => {
    let count = 0;
    return {
      show: () => count,
      countUp: async () => {
        await sleep(Math.floor(Math.random() * 50));
        count += 1;
        return `done${count}`;
      },
    };
  };

  await t0.step("without interval", async (t1) => {
    await t1.step("trailing: false", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp);

        results[0] = await countUp(); // run
        assertStrictEquals(show(), 1);
        results[1] = await countUp(); // run
        assertStrictEquals(show(), 2);
        results[2] = await countUp(); // run
        assertStrictEquals(show(), 3);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done2" });
        assertEquals(results[2], { executed: true, result: "done3" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp);

        results[0] = countUp(); // run
        assertStrictEquals(show(), 0);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[2] = countUp(); // skip
        assertStrictEquals(show(), 0);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp);

        results = await Promise.all([
          countUp(), // run
          countUp(), // skip
          countUp(), // skip
          countUp(), // skip
        ]);
        assertStrictEquals(show(), 1);

        assertEquals(results[0], { executed: true, result: "done1" });
        assert(!results[1].executed);
        assert(!results[2].executed);
        assert(!results[3].executed);
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp);

        results[0] = countUp(); // run
        assertStrictEquals(show(), 0);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[2] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[3] = countUp(); // skip
        assertStrictEquals(show(), 0);
        await results[0];
        assertStrictEquals(show(), 1);
        results[4] = countUp(); // run
        assertStrictEquals(show(), 1);
        results[5] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[6] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[7] = countUp(); // skip
        assertStrictEquals(show(), 1);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[4], { executed: true, result: "done2" });
        assertStrictEquals(show(), 2);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 2);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 2);
        assert(!(await results[7]).executed);
        assertStrictEquals(show(), 2);
      });
    });

    await t1.step("trailing: true", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { trailing: true });

        results[0] = await countUp(); // run
        assertStrictEquals(show(), 1);
        results[1] = await countUp(); // run
        assertStrictEquals(show(), 2);
        results[2] = await countUp(); // run
        assertStrictEquals(show(), 3);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done2" });
        assertEquals(results[2], { executed: true, result: "done3" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { trailing: true });

        results[0] = countUp(); // run
        assertStrictEquals(show(), 0);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[2] = countUp(); // run
        assertStrictEquals(show(), 0);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[2], { executed: true, result: "done2" });
        assertStrictEquals(show(), 2);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { trailing: true });

        results = await Promise.all([
          countUp(), // run
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        assertStrictEquals(show(), 2);

        assertEquals(results[0], { executed: true, result: "done1" });
        assert(!results[1].executed);
        assert(!results[2].executed);
        assertEquals(results[3], { executed: true, result: "done2" });
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { trailing: true });

        results[0] = countUp(); // run
        assertStrictEquals(show(), 0);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[2] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[3] = countUp(); // run
        assertStrictEquals(show(), 0);
        await results[0];
        assertStrictEquals(show(), 1);
        results[4] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[5] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[6] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[7] = countUp(); // run
        assertStrictEquals(show(), 1);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[3], { executed: true, result: "done2" });
        assertStrictEquals(show(), 2);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 2);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 2);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 2);
        assertEquals(await results[7], { executed: true, result: "done3" });
        assertStrictEquals(show(), 3);
      });
    });
  });

  await t0.step("with interval", async (t1) => {
    await t1.step("trailing: false", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { interval: 500 });

        results[0] = await countUp(); // run
        assertStrictEquals(show(), 1);
        results[1] = await countUp(); // run
        assertStrictEquals(show(), 2);
        results[2] = await countUp(); // run
        assertStrictEquals(show(), 3);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done2" });
        assertEquals(results[2], { executed: true, result: "done3" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { interval: 500 });

        results[0] = countUp(); // skip
        assertStrictEquals(show(), 0);
        await sleep(50);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[2] = countUp(); // run
        assertStrictEquals(show(), 0);
        await sleep(500);
        assertStrictEquals(show(), 1);
        results[3] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[4] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[5] = countUp(); // run
        assertStrictEquals(show(), 1);

        assert(!(await results[0]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[2], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[5], { executed: true, result: "done2" });
        assertStrictEquals(show(), 2);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { interval: 500 });

        results = await Promise.all([
          countUp(), // skip
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        assertStrictEquals(show(), 1);

        assert(!results[0].executed);
        assert(!results[1].executed);
        assert(!results[2].executed);
        assertEquals(results[3], { executed: true, result: "done1" });
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeCountUp();
        const countUp = throttle(rest.countUp, { interval: 500 });

        results[0] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[1] = countUp(); // skip
        assertStrictEquals(show(), 0);
        await sleep(50);
        results[2] = countUp(); // skip
        assertStrictEquals(show(), 0);
        results[3] = countUp(); // run
        assertStrictEquals(show(), 0);
        await results[3];
        assertStrictEquals(show(), 1);
        results[4] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[5] = countUp(); // skip
        assertStrictEquals(show(), 1);
        await sleep(50);
        results[6] = countUp(); // skip
        assertStrictEquals(show(), 1);
        results[7] = countUp(); // run
        assertStrictEquals(show(), 1);

        assert(!(await results[0]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[3], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[7], { executed: true, result: "done2" });
        assertStrictEquals(show(), 2);
      });
    });
  });
});

Deno.test("with arguments", async (t0) => {
  let results = [] as (Promise<Result<string>>[] | Result<string>[]);
  const makeAdd = () => {
    let count = 0;
    return {
      show: () => count,
      add: async (...increments: number[]) => {
        await sleep(Math.floor(Math.random() * 50));
        if (increments.includes(-1)) throw new Error("-1");
        count += increments.reduce((a, b) => a + b, 0);
        return `done${count}`;
      },
    };
  };

  await t0.step("without interval", async (t1) => {
    await t1.step("trailing: false", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add);

        results[0] = await add(1); // run
        assertStrictEquals(show(), 1);
        results[1] = await add(2, 3); // run
        assertStrictEquals(show(), 6);
        results[2] = await add(4, 5, 6, 7, 8, 9); // run
        assertStrictEquals(show(), 45);
        results[3] = await add(); // run
        assertStrictEquals(show(), 45);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done6" });
        assertEquals(results[2], { executed: true, result: "done45" });
        assertEquals(results[3], { executed: true, result: "done45" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add);

        results[0] = add(1); // run
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(4); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // skip
        assertStrictEquals(show(), 0);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 1);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add);

        results = await Promise.all([
          add(1, 2, 3), // run
          add(4), // skip
          add(6), // skip
          add(5), // skip
        ]);
        assertStrictEquals(show(), 6);

        assertEquals(results[0], { executed: true, result: "done6" });
        assert(!results[1].executed);
        assert(!results[2].executed);
        assert(!results[3].executed);
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add);

        results[0] = add(1); // run
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(5, 1); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // skip
        assertStrictEquals(show(), 0);
        await results[0];
        assertStrictEquals(show(), 1);
        results[4] = add(4, 5, 6); // run
        assertStrictEquals(show(), 1);
        results[5] = add(7); // skip
        assertStrictEquals(show(), 1);
        results[6] = add(8); // skip
        assertStrictEquals(show(), 1);
        results[7] = add(9, 10, 11); // skip
        assertStrictEquals(show(), 1);
        results[8] = add(12); // skip
        assertStrictEquals(show(), 1);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[4], { executed: true, result: "done16" });
        assertStrictEquals(show(), 16);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 16);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 16);
        assert(!(await results[7]).executed);
        assertStrictEquals(show(), 16);
        assert(!(await results[8]).executed);
        assertStrictEquals(show(), 16);
      });

      await step("throw error", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add);

        results[0] = add(-1); // throw error
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(-1); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // skip
        assertStrictEquals(show(), 0);

        assertThrowsAsync(
          () => results[0] as Promise<Result<string>>,
          Error,
          "-1",
        );
        assertStrictEquals(show(), 0);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 0);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 0);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 0);
      });
    });

    await t1.step("trailing: true", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { trailing: true });

        results[0] = await add(1); // run
        assertStrictEquals(show(), 1);
        results[1] = await add(2, 3); // run
        assertStrictEquals(show(), 6);
        results[2] = await add(4, 5, 6, 7, 8, 9); // run
        assertStrictEquals(show(), 45);
        results[3] = await add(); // run
        assertStrictEquals(show(), 45);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done6" });
        assertEquals(results[2], { executed: true, result: "done45" });
        assertEquals(results[3], { executed: true, result: "done45" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { trailing: true });

        results[0] = add(1); // run
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(4); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // run
        assertStrictEquals(show(), 0);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[3], { executed: true, result: "done4" });
        assertStrictEquals(show(), 4);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { trailing: true });

        results = await Promise.all([
          add(1, 2, 3), // run
          add(4), // skip
          add(6), // skip
          add(5), // run
        ]);
        assertStrictEquals(show(), 11);

        assertEquals(results[0], { executed: true, result: "done6" });
        assert(!results[1].executed);
        assert(!results[2].executed);
        assertEquals(results[3], { executed: true, result: "done11" });
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { trailing: true });

        results[0] = add(1); // run
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(5, 1); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // run
        assertStrictEquals(show(), 0);
        await results[0];
        assertStrictEquals(show(), 1);
        results[4] = add(4, 5, 6); // skip
        assertStrictEquals(show(), 1);
        results[5] = add(7); // skip
        assertStrictEquals(show(), 1);
        results[6] = add(8); // skip
        assertStrictEquals(show(), 1);
        results[7] = add(9, 10, 11); // skip
        assertStrictEquals(show(), 1);
        results[8] = add(12); // run
        assertStrictEquals(show(), 1);

        assertEquals(await results[0], { executed: true, result: "done1" });
        assertStrictEquals(show(), 1);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 1);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 1);
        assertEquals(await results[3], { executed: true, result: "done4" });
        assertStrictEquals(show(), 4);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 4);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 4);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 4);
        assert(!(await results[7]).executed);
        assertStrictEquals(show(), 4);
        assertEquals(await results[8], { executed: true, result: "done16" });
        assertStrictEquals(show(), 16);
      });

      await step("throw error", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { trailing: true });

        results[0] = add(-1); // throw error
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(-1); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // run
        assertStrictEquals(show(), 0);

        assertThrowsAsync(
          () => results[0] as Promise<Result<string>>,
          Error,
          "-1",
        );
        assertStrictEquals(show(), 0);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 0);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 0);
        assertEquals(await results[3], { executed: true, result: "done3" });
        assertStrictEquals(show(), 3);
      });
    });
  });

  await t0.step("without interval", async (t1) => {
    await t1.step("trailing: false", async ({ step }) => {
      await step("acts as normal async-await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { interval: 500 });

        results[0] = await add(1); // run
        assertStrictEquals(show(), 1);
        results[1] = await add(2, 3); // run
        assertStrictEquals(show(), 6);
        results[2] = await add(4, 5, 6, 7, 8, 9); // run
        assertStrictEquals(show(), 45);
        results[3] = await add(); // run
        assertStrictEquals(show(), 45);

        assertEquals(results[0], { executed: true, result: "done1" });
        assertEquals(results[1], { executed: true, result: "done6" });
        assertEquals(results[2], { executed: true, result: "done45" });
        assertEquals(results[3], { executed: true, result: "done45" });
      });

      await step("suppress multiple calls", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { interval: 500 });

        results[0] = add(1); // skip
        assertStrictEquals(show(), 0);
        await sleep(50);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(4); // run
        assertStrictEquals(show(), 0);
        await sleep(500);
        results[3] = add(3); // skip
        assertStrictEquals(show(), 4);
        results[4] = add(8); // skip
        assertStrictEquals(show(), 4);
        results[5] = add(); // run
        assertStrictEquals(show(), 4);

        assert(!(await results[0]).executed);
        assertStrictEquals(show(), 4);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 4);
        assertEquals(await results[2], { executed: true, result: "done4" });
        assertStrictEquals(show(), 4);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 4);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 4);
        assertEquals(await results[5], { executed: true, result: "done4" });
        assertStrictEquals(show(), 4);
      });

      await step("suppress multiple calls [Promise.all()]", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { interval: 500 });

        results = await Promise.all([
          add(1, 2, 3), // skip
          add(4), // skip
          add(6), // skip
          add(5), // run
        ]);
        assertStrictEquals(show(), 5);

        assert(!results[0].executed);
        assert(!results[1].executed);
        assert(!results[2].executed);
        assertEquals(results[3], { executed: true, result: "done5" });
      });

      await step("suppress and await", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { interval: 500 });

        results[0] = add(1); // skip
        assertStrictEquals(show(), 0);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        await sleep(50);
        results[2] = add(5, 1); // skip
        assertStrictEquals(show(), 0);
        results[3] = add(3); // run
        assertStrictEquals(show(), 0);
        await results[3];
        assertStrictEquals(show(), 3);
        results[4] = add(4, 5, 6); // skip
        assertStrictEquals(show(), 3);
        results[5] = add(7); // skip
        assertStrictEquals(show(), 3);
        await sleep(50);
        results[6] = add(8); // skip
        assertStrictEquals(show(), 3);
        results[7] = add(9, 10, 11); // run
        assertStrictEquals(show(), 3);

        assert(!(await results[0]).executed);
        assertStrictEquals(show(), 3);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 3);
        assert(!(await results[2]).executed);
        assertStrictEquals(show(), 3);
        assertEquals(await results[3], { executed: true, result: "done3" });
        assertStrictEquals(show(), 3);
        assert(!(await results[4]).executed);
        assertStrictEquals(show(), 3);
        assert(!(await results[5]).executed);
        assertStrictEquals(show(), 3);
        assert(!(await results[6]).executed);
        assertStrictEquals(show(), 3);
        assertEquals(await results[7], { executed: true, result: "done33" });
        assertStrictEquals(show(), 33);
      });

      await step("throw error", async () => {
        const { show, ...rest } = makeAdd();
        const add = throttle(rest.add, { interval: 500 });

        results[0] = add(-1); // skip
        assertStrictEquals(show(), 0);
        await sleep(50);
        results[1] = add(2); // skip
        assertStrictEquals(show(), 0);
        results[2] = add(-1); // throw error
        assertThrowsAsync(
          () => results[2] as Promise<Result<string>>,
          Error,
          "-1",
        );
        assertStrictEquals(show(), 0);
        await sleep(500);
        results[3] = add(3); // skip
        assertStrictEquals(show(), 0);
        results[4] = add(4); // run
        assertStrictEquals(show(), 0);

        assert(!(await results[0]).executed);
        assertStrictEquals(show(), 0);
        assert(!(await results[1]).executed);
        assertStrictEquals(show(), 0);
        assert(!(await results[3]).executed);
        assertStrictEquals(show(), 0);
        assertEquals(await results[4], { executed: true, result: "done4" });
        assertStrictEquals(show(), 4);
      });
    });
  });
});
