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
  let countUp = (): Promise<Result<string>> =>
    Promise.resolve({ executed: false });
  const targetFunc = async () => {
    await sleep(Math.floor(Math.random() * 50));
    count += 1;
    return `done${count}`;
  };

  beforeEach(() => {
    count = 0;
    results = [];
  });

  describe("without interval", () => {
    describe("immediate: true", () => {
      beforeEach(() => {
        countUp = throttle(targetFunc);
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
      beforeEach(() => {
        countUp = throttle(targetFunc, { immediate: false });
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
    let interval = 100;
    beforeEach(() => {
      interval = Math.floor(Math.random() * 400 + 100);
    });

    describe("immediate: true", () => {
      beforeEach(() => {
        countUp = throttle(targetFunc, { interval });
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
        await Promise.resolve(); // any other microtask
        results[3] = countUp(); // skip
        expect(count).toBe(0);
        results[4] = countUp(); // skip
        expect(count).toBe(0);
        await sleep(interval / 2); // wait for less than `interval`
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
        expect(await results[3]).toEqual({ executed: false });
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
      beforeEach(() => {
        countUp = throttle(targetFunc, { interval, immediate: false });
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
        results[0] = countUp(); // skip
        expect(count).toBe(0);
        results[1] = countUp(); // skip
        expect(count).toBe(0);
        await sleep(interval / 2);
        results[2] = countUp(); // skip
        expect(count).toBe(0);
        results[3] = countUp(); // run
        expect(count).toBe(0);
        await sleep(interval);
        results[4] = countUp(); // skip
        expect(count).toBe(1);
        results[5] = countUp(); // run
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
        expect(await results[5]).toEqual({ executed: true, result: "done2" });
        expect(count).toBe(2);
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
  let add = (..._args: number[]): Promise<Result<string>> =>
    Promise.resolve({ executed: false });
  const targetFunc = async (...increments: number[]) => {
    await sleep(Math.floor(Math.random() * 50));
    if (increments.includes(-1)) throw new Error("-1");
    count += increments.reduce((a, b) => a + b, 0);
    return `done${count}`;
  };

  beforeEach(() => {
    count = 0;
    results = [];
  });

  describe("without interval", () => {
    describe("immediate: true", () => {
      beforeEach(() => {
        add = throttle(targetFunc);
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
        results[3] = add(3); // run
        expect(count).toBe(0);
        await results[0];
        results[4] = add(4, 5, 6); // skip
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
        expect(await results[3]).toEqual({ executed: true, result: "done4" });
        expect(count).toBe(4);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[7]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[8]).toEqual({ executed: true, result: "done16" });
        expect(count).toBe(16);
      });

      it("throw error", async () => {
        results[0] = add(-1); // throw error
        expect(count).toBe(0);
        results[1] = add(2); // skip
        expect(count).toBe(0);
        results[2] = add(-1); // skip
        expect(count).toBe(0);
        results[3] = add(3); // run
        expect(count).toBe(0);

        expect(results[0]).rejects.toMatch("-1");
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: true, result: "done3" });
        expect(count).toBe(3);
      });
    });

    describe("immediate: false", () => {
      beforeEach(() => {
        add = throttle(targetFunc, { immediate: false });
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
        results[0] = add(1); // skip
        expect(count).toBe(0);
        results[1] = add(2); // skip
        expect(count).toBe(0);
        results[2] = add(4); // skip
        expect(count).toBe(0);
        results[3] = add(3); // run
        expect(count).toBe(0);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: true, result: "done3" });
        expect(count).toBe(3);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          add(1, 2, 3), // skip
          add(4), // skip
          add(6), // skip
          add(5), // run
        ]);
        expect(count).toBe(5);

        expect(results[0]).toEqual({ executed: false });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done5" });
      });

      it("suppress and await", async () => {
        results[0] = add(1); // skip
        expect(count).toBe(0);
        results[1] = add(2); // skip
        expect(count).toBe(0);
        results[2] = add(5, 1); // skip
        expect(count).toBe(0);
        results[3] = add(3); // run
        expect(count).toBe(0);
        await results[3];
        results[4] = add(4, 5, 6); // skip
        expect(count).toBe(3);
        results[5] = add(7); // skip
        expect(count).toBe(3);
        results[6] = add(8); // skip
        expect(count).toBe(3);
        results[7] = add(9, 10, 11); // skip
        expect(count).toBe(3);
        results[8] = add(12); // run
        expect(count).toBe(3);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[3]).toEqual({ executed: true, result: "done3" });
        expect(count).toBe(3);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[7]).toEqual({ executed: false });
        expect(count).toBe(3);
        expect(await results[8]).toEqual({ executed: true, result: "done15" });
        expect(count).toBe(15);
      });

      it("throw error", async () => {
        results[0] = add(-1); // skip
        expect(count).toBe(0);
        results[1] = add(2); // skip
        expect(count).toBe(0);
        results[2] = add(-1); // skip
        expect(count).toBe(0);
        results[3] = add(-1); // throw error
        expect(count).toBe(0);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        await results[3].catch(() => {}); // make sure all promises are settled
        expect(results[3]).rejects.toMatch("-1");
        expect(count).toBe(0);
      });
    });
  });

  describe("with interval", () => {
    let interval = 100;
    beforeEach(() => {
      interval = Math.floor(Math.random() * 400 + 100);
    });

    describe("immediate: true", () => {
      beforeEach(() => {
        add = throttle(targetFunc, { interval });
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
        results[1] = add(2, 4); // skip
        expect(count).toBe(0);
        results[2] = add(5); // skip
        expect(count).toBe(0);
        await Promise.resolve(); // any other microtask
        results[3] = add(7); // skip
        expect(count).toBe(0);
        results[4] = add(); // skip
        expect(count).toBe(0);
        await sleep(interval / 2); // wait for less than `interval`
        results[5] = add(4, 5, 43); // skip
        expect(count).toBe(1);
        results[6] = add(8); // skip
        expect(count).toBe(1);
        results[7] = add(2, 3, 4); // run
        expect(count).toBe(1);

        expect(await results[0]).toEqual({ executed: true, result: "done1" });
        expect(count).toBe(1);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[3]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(1);
        expect(await results[7]).toEqual({ executed: true, result: "done10" });
        expect(count).toBe(10);
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
        results[3] = add(3); // run
        expect(count).toBe(0);
        await results[0];
        results[4] = add(4, 5, 6); // skip
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
        expect(await results[3]).toEqual({ executed: true, result: "done4" });
        expect(count).toBe(4);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[5]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[6]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[7]).toEqual({ executed: false });
        expect(count).toBe(4);
        expect(await results[8]).toEqual({ executed: true, result: "done16" });
        expect(count).toBe(16);
      });

      it("throw error", async () => {
        results[0] = add(-1); // throw error
        results[0].catch(() => {});
        expect(count).toBe(0);
        results[1] = add(2, 4); // skip
        expect(count).toBe(0);
        results[2] = add(5); // skip
        expect(count).toBe(0);
        await sleep(interval / 2); // wait for less than `interval`
        results[3] = add(4, 5, 43); // skip
        expect(count).toBe(0);
        results[4] = add(-1); // skip
        expect(count).toBe(0);
        results[5] = add(2, 3, 4); // run
        expect(count).toBe(0);

        expect(results[0]).rejects.toMatch("-1");
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[5]).toEqual({ executed: true, result: "done9" });
        expect(count).toBe(9);
      });
    });

    describe("immediate: false", () => {
      beforeEach(() => {
        add = throttle(targetFunc, { interval, immediate: false });
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
        results[0] = add(); // skip
        expect(count).toBe(0);
        results[1] = add(4, 5, 6); // skip
        expect(count).toBe(0);
        await sleep(interval / 2);
        results[2] = add(4); // skip
        expect(count).toBe(0);
        results[3] = add(45); // run
        expect(count).toBe(0);
        await sleep(interval / 2);
        results[4] = add(); // skip
        expect(count).toBe(0);
        results[5] = add(4, 5); // run
        expect(count).toBe(0);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[3]).toEqual({ executed: true, result: "done45" });
        expect(count).toBe(45);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(45);
        expect(await results[5]).toEqual({ executed: true, result: "done54" });
        expect(count).toBe(54);
      });

      it("suppress multiple calls [Promise.all()]", async () => {
        results = await Promise.all([
          add(1, 2, 3), // skip
          add(4), // skip
          add(6), // skip
          add(5), // run
        ]);
        expect(count).toBe(5);

        expect(results[0]).toEqual({ executed: false });
        expect(results[1]).toEqual({ executed: false });
        expect(results[2]).toEqual({ executed: false });
        expect(results[3]).toEqual({ executed: true, result: "done5" });
      });

      it("suppress and await", async () => {
        results[0] = add(1); // skip
        expect(count).toBe(0);
        results[1] = add(4, 5, 12); // skip
        expect(count).toBe(0);
        results[2] = add(34); // skip
        expect(count).toBe(0);
        results[3] = add(1, 0); // run
        expect(count).toBe(0);
        await results[3];
        expect(count).toBe(1);
        results[4] = add(); // skip
        expect(count).toBe(1);
        results[5] = add(3433); // skip
        expect(count).toBe(1);
        results[6] = add(3, 2, 1); // skip
        expect(count).toBe(1);
        results[7] = add(1); // run
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

      it("throw error", async () => {
        results[0] = add(); // skip
        expect(count).toBe(0);
        results[1] = add(4, 5, 6); // skip
        expect(count).toBe(0);
        await sleep(interval / 2);
        results[2] = add(4, -1); // skip
        expect(count).toBe(0);
        results[3] = add(-1); // throw error
        results[3].catch(() => {});
        expect(count).toBe(0);
        await sleep(interval / 2);
        results[4] = add(); // skip
        expect(count).toBe(0);
        results[5] = add(4, 5); // run
        expect(count).toBe(0);

        expect(await results[0]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[1]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[2]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(results[3]).rejects.toMatch("-1");
        expect(count).toBe(0);
        expect(await results[4]).toEqual({ executed: false });
        expect(count).toBe(0);
        expect(await results[5]).toEqual({ executed: true, result: "done9" });
        expect(count).toBe(9);
      });
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
