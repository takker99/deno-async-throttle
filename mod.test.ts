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

describe("without arguments", () => {
  let count = 0;
  let results = [] as (Promise<Result<string>>[] | Result<string>[]);

  beforeEach(() => {
    count = 0;
    results = [];
  });

  describe("without interval", () => {
    describe("immediate: true", () => {
      const countUp = throttle(async () => {
        await sleep(Math.floor(Math.random() * 50));
        count += 1;
        return `done${count}`;
      });

      it("acts as normal async-await", async () => {
        results[0] = await countUp(); // run
        expect(count).toBe(1);
        results[1] = await countUp(); // run
        expect(count).toBe(2);
        results[2] = await countUp(); // run
        expect(count).toBe(3);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: true, result: "done2" });
        expect(results[2]).toEqual({ executed: true, result: "done3" });
      });

      it("suppress multiple calls", async () => {
        results[0] = countUp(); // run
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        expect(await results[0]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          countUp(), // run
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        expect(count).toBe(2);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done2" });
      });

      it("suppress and await", async () => {
        results[0] = countUp(); // run
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // skip
        expect(count).toBe(0);
        await results[0];
        expect(count).toBe(1);
        results[4] = countUp(); // run
        expect(count).toBe(1);
        results[5] = countUp(); // skip
        expect(count).toBe(1);
        results[6] = countUp(); // skip
        expect(count).toBe(1);
        results[7] = countUp(); // run
        expect(count).toBe(1);

        expect(await results[0]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[7]).toEqual({ executed: true, result: "done3" });
        expect(count).toBe(3);
      });
    });

    describe("immediate: false", () => {
      const countUp = throttle(async () => {
        await sleep(Math.floor(Math.random() * 50));
        count += 1;
        return `done${count}`;
      }, { immediate: false });

      it("acts as normal async-await", async () => {
        results[0] = await countUp(); // run
        expect(count).toBe(1);
        results[1] = await countUp(); // run
        expect(count).toBe(2);
        results[2] = await countUp(); // run
        expect(count).toBe(3);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: true, result: "done2" });
        expect(results[2]).toEqual({ executed: true, result: "done3" });
      });

      it("suppress multiple calls", async () => {
        results[0] = countUp(); // skip
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          countUp(), // skip
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        expect(count).toBe(1);
        expect(results[0]).toEqual({ executed: false });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done1" });
      });

      it("suppress and await", async () => {
        results[0] = countUp(); // skip
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        await results[3];
        expect(count).toBe(1);
        results[4] = countUp(); // skip
        expect(count).toBe(1);
        results[5] = countUp(); // skip
        expect(count).toBe(1);
        results[6] = countUp(); // skip
        expect(count).toBe(1);
        results[7] = countUp(); // run
        expect(count).toBe(1);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[7]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
      });
    });
  });

  describe("with interval", () => {
    const interval = Math.floor(Math.random() * 500);
    describe("immediate: true", () => {
      const countUp = throttle(async () => {
        await sleep(Math.floor(Math.random() * 50));
        count += 1;
        return `done${count}`;
      }, { interval });

      it("acts as normal async-await", async () => {
        results[0] = await countUp(); // run
        expect(count).toBe(1);
        results[1] = await countUp(); // run
        expect(count).toBe(2);
        results[2] = await countUp(); // run
        expect(count).toBe(3);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: true, result: "done2" });
        expect(results[2]).toEqual({ executed: true, result: "done3" });
      });

      it("suppress multiple calls", async () => {
        results[0] = countUp(); // run
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);

        expect(await results[0]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          countUp(), // run
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        expect(count).toBe(2);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done2" });
      });

      it("suppress and await", async () => {
        results[0] = countUp(); // run
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        await results[0];
        expect(count).toBe(1);
        results[4] = countUp(); // skip
        expect(count).toBe(1);
        results[5] = countUp(); // skip
        expect(count).toBe(1);
        results[6] = countUp(); // skip
        expect(count).toBe(1);
        results[7] = countUp(); // run
        expect(count).toBe(1);

        expect(await results[0]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(2);
        expect(await results[7]).toEqual({ executed: true, result: "done3" });
        expect(count).toBe(3);
      });
    });

    describe("immediate: false", () => {
      const countUp = throttle(async () => {
        await sleep(Math.floor(Math.random() * 50));
        count += 1;
        return `done${count}`;
      }, { interval, immediate: false });

      it("acts as normal async-await", async () => {
        results[0] = await countUp(); // run
        expect(count).toBe(1);
        results[1] = await countUp(); // run
        expect(count).toBe(2);
        results[2] = await countUp(); // run
        expect(count).toBe(3);
        expect(results[0]).toEqual({ executed: true, result: "done1" });
        expect(results[1]).toEqual({ executed: true, result: "done2" });
        expect(results[2]).toEqual({ executed: true, result: "done3" });
      });

      it("suppress multiple calls", async () => {
        results[0] = countUp(); // skip
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          countUp(), // skip
          countUp(), // skip
          countUp(), // skip
          countUp(), // run
        ]);
        expect(count).toBe(1);
        expect(results[0]).toEqual({ executed: false });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done1" });
      });

      it("suppress and await", async () => {
        results[0] = countUp(); // skip
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        await results[3];
        expect(count).toBe(1);
        results[4] = countUp(); // skip
        expect(count).toBe(1);
        results[5] = countUp(); // skip
        expect(count).toBe(1);
        results[6] = countUp(); // skip
        expect(count).toBe(1);
        results[7] = countUp(); // run
        expect(count).toBe(1);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[7]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
      });
    });
  });
});
describe("with arguemnts", () => {
  let count = 0;
  let results = [] as (Promise<Result<string>>[] | Result<string>[]);

  beforeEach(() => {
    count = 0;
    results = [];
  });

  describe("immediate: true", () => {
    const add = throttle(async (...increments: number[]) => {
      await sleep(Math.floor(Math.random() * 50));
      count += increments.reduce((a, b) => a + b, 0);
      return `done${count}`;
    });

    it("acts as normal async-await", async () => {
      results[0] = await add(1); // run
      expect(count).toBe(1);
      results[1] = await add(2, 3); // run
      expect(count).toBe(6);
      results[2] = await add(4, 5, 6, 7, 8, 9); // run
      expect(count).toBe(45);
      results[3] = await add(); // run
      expect(count).toBe(45);
      expect(results[0]).toEqual({ executed: true, result: "done1" });
      expect(results[1]).toEqual({ executed: true, result: "done6" });
      expect(results[2]).toEqual({ executed: true, result: "done45" });
      expect(results[3]).toEqual({ executed: true, result: "done45" });
    });

    it("suppress multiple calls", async () => {
      results[0] = add(1); // run
      expect(count).toBe(0);
      results[1] = add(2); // skip
      expect(count).toBe(0);
      results[2] = add(4); // skip
      expect(count).toBe(0);
      results[3] = add(3); // run
      expect(count).toBe(0);

      expect(await results[0]).toEqual({ executed: true, result: "done1" });
      expect(count).toBe(1);
      expect(await results[1]).toEqual({ executed: false });
      expect(count).toBe(1);
      expect(await results[2]).toEqual({ executed: false });
      expect(count).toBe(1);
      expect(await results[3]).toEqual({ executed: true, result: "done4" });
      expect(count).toBe(4);
    });

    it("suppress multiple calls [Promise.all()]", async () => {
      results = await Promise.all([
        add(1, 2, 3), // run
        add(4), // skip
        add(6), // skip
        add(5), // run
      ]);
      expect(count).toBe(11);
      expect(results[0]).toEqual({ executed: true, result: "done6" });
      expect(results[1]).toEqual({ executed: false });
      expect(results[2]).toEqual({ executed: false });
      expect(results[3]).toEqual({ executed: true, result: "done11" });
    });

    it("suppress and await", async () => {
      results[0] = add(1); // run
      expect(count).toBe(0);
      results[1] = add(2); // skip
      expect(count).toBe(0);
      results[2] = add(5, 1); // skip
      expect(count).toBe(0);
      results[3] = add(3); // skip
      expect(count).toBe(0);
      await results[0];
      results[4] = add(4, 5, 6); // run
      expect(count).toBe(1);
      results[5] = add(7); // skip
      expect(count).toBe(1);
      results[6] = add(8); // skip
      expect(count).toBe(1);
      results[7] = add(9, 10, 11); // skip
      expect(count).toBe(1);
      results[8] = add(12); // run
      expect(count).toBe(1);

      expect(await results[0]).toEqual({ executed: true, result: "done1" });
      expect(count).toBe(1);
      expect(await results[1]).toEqual({ executed: false });
      expect(count).toBe(1);
      expect(await results[2]).toEqual({ executed: false });
      expect(count).toBe(1);
      expect(await results[3]).toEqual({ executed: false });
      expect(count).toBe(1);
      expect(await results[4]).toEqual({ executed: true, result: "done16" });
      expect(count).toBe(16);
      expect(await results[5]).toEqual({ executed: false });
      expect(count).toBe(16);
      expect(await results[6]).toEqual({ executed: false });
      expect(count).toBe(16);
      expect(await results[7]).toEqual({ executed: false });
      expect(count).toBe(16);
      expect(await results[8]).toEqual({ executed: true, result: "done28" });
      expect(count).toBe(28);
    });
  });
});

describe("on error", () => {
  const throttled = throttle((msg: string) => {
    throw new Error(msg);
  });
  it("throw error", () => {
    expect(throttled("error one")).rejects.toMatch("error one");
    expect(throttled("error two")).rejects.toMatch("error two");
  });
});

run();
