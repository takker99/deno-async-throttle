// the tests are based on https://github.com/shokai/async-throttle/blob/v0.2.1/test/index.js
import { throttle } from "./mod.ts";
import { sleep } from "./sleep.ts";
import {
  beforeEach,
  describe,
  expect,
  it,
  run,
} from "https://deno.land/x/tincan@0.2.2/mod.ts";

describe("one-by-one", () => {
  describe("without arguments", () => {
    let count = 0;
    const throttled = throttle(async () => {
      count += 1;
      await sleep(10);
      return `done${count}`;
    });

    beforeEach(() => {
      count = 0;
    });

    it("acts as normal async-await", async () => {
      const result = await throttled();
      const result2 = await throttled();
      const result3 = await throttled();
      expect(count).toBe(3);
      expect(result).toEqual({ executed: true, result: "done1" });
      expect(result2).toEqual({ executed: true, result: "done2" });
      expect(result3).toEqual({ executed: true, result: "done3" });
    });
  });

  describe("with arguemnts", function () {
    let count = 0;
    const throttled = throttle(async (...increments: number[]) => {
      if (increments.length > 0) count += increments.reduce((a, b) => a + b);
      await sleep(10);
      return `done${count}`;
    });

    beforeEach(() => {
      count = 0;
    });

    it("acts as normal async-await", async () => {
      const result = await throttled(1);
      const result2 = await throttled(2, 3);
      const result3 = await throttled(4, 5, 6, 7, 8, 9);
      const result4 = await throttled();
      expect(count).toBe(45);
      expect(result).toEqual({ executed: true, result: "done1" });
      expect(result2).toEqual({ executed: true, result: "done6" });
      expect(result3).toEqual({ executed: true, result: "done45" });
      expect(result4).toEqual({ executed: true, result: "done45" });
    });
  });

  describe("on error", function () {
    const throttled = throttle((msg: string) => {
      throw new Error(msg);
    });
    it("throw error", () => {
      expect(throttled("error one")).rejects.toMatch("error one");
      expect(throttled("error two")).rejects.toMatch("error two");
    });
  });
});

run();
