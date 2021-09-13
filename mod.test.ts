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
  const countUp = throttle(async () => {
    await sleep(0);
    count += 1;
    return `done${count}`;
  });

  beforeEach(() => {
    count = 0;
    results = [];
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
    results[2] = countUp(); // run
    expect(count).toBe(0);
    expect(await results[0]).toEqual({ executed: true, result: "done1" });
    expect(count).toBe(1);
    expect(await results[1]).toEqual({ executed: false });
    expect(count).toBe(1);
    expect(await results[2]).toEqual({ executed: true, result: "done2" });
    expect(count).toBe(2);
  });

  it("suppress multiple calls [Promise.all()]", async () => {
    results = await Promise.all([
      countUp(), // run
      countUp(), // skip
      countUp(), // run
    ]);
    expect(count).toBe(2);
    expect(results[0]).toEqual({ executed: true, result: "done1" });
    expect(results[1]).toEqual({ executed: false });
    expect(results[2]).toEqual({ executed: true, result: "done2" });
  });
});
describe("with arguemnts", () => {
  let count = 0;
  let results = [] as (Promise<Result<string>>[] | Result<string>[]);
  const add = throttle(async (...increments: number[]) => {
    await sleep(0);
    count += increments.reduce((a, b) => a + b, 0);
    return `done${count}`;
  });

  beforeEach(() => {
    count = 0;
    results = [];
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
    results[2] = add(3); // run
    expect(count).toBe(0);
    expect(await results[0]).toEqual({ executed: true, result: "done1" });
    expect(count).toBe(1);
    expect(await results[1]).toEqual({ executed: false });
    expect(count).toBe(1);
    expect(await results[2]).toEqual({ executed: true, result: "done4" });
    expect(count).toBe(4);
    await results[2];

    results[0] = add(4, 5, 6); // run
    results[1] = add(7); // skip
    results[2] = add(8); // skip
    results[3] = add(9, 10, 11); // skip
    results[4] = add(12); // run
    expect(await results[0]).toEqual({ executed: true, result: "done19" });
    expect(count).toBe(19);
    expect(await results[1]).toEqual({ executed: false });
    expect(count).toBe(19);
    expect(await results[2]).toEqual({ executed: false });
    expect(count).toBe(19);
    expect(await results[3]).toEqual({ executed: false });
    expect(count).toBe(19);
    expect(await results[4]).toEqual({ executed: true, result: "done31" });
    expect(count).toBe(31);

    const result = await add(13, 14, 15); // run
    expect(count).toBe(73);
    expect(result).toEqual({ executed: true, result: "done73" });

    const [result2, result3, result4] = await Promise.all([
      add(16, 17, 18), // run
      add(19), // skip
      add(20), // run
    ]);
    expect(count).toBe(144);
    expect(result2).toEqual({ executed: true, result: "done124" });
    expect(result3).toEqual({ executed: false });
    expect(result4).toEqual({ executed: true, result: "done144" });
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
