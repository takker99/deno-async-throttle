# @takker/throttle

[![JSR](https://jsr.io/badges/@takker/throttle)](https://jsr.io/@takker/throttle)
[![test](https://github.com/takker99/deno-async-throttle/workflows/ci/badge.svg)](https://github.com/takker99/deno-async-throttle/actions?query=workflow%3Aci)

[Throttle](https://developer.mozilla.org/docs/Glossary/Throttle) implementation
for Deno/Web browsers.

## Usage

```ts
import { assertEquals, assertRejects } from "@std/assert";
import { throttle, type ThrottledState } from "@takker/throttle";

const throttledFn = throttle((i: number, state: ThrottledState) => {
  if (i === 1 && state !== "discarded") throw new Error("Test error");
  return `${i}-${state}`;
}, { maxQueued: 0 });

assertEquals(await throttledFn(0), "0-immediate");
await throttledFn.ready;
await assertRejects(() => throttledFn(1), Error, "Test error");
await throttledFn.ready;
assertEquals(await throttledFn(2), "2-immediate");
await throttledFn.ready;

const promises = Array.from({ length: 4 }).map((_, i) => throttledFn(i));
await throttledFn.ready;
assertEquals(await promises[0], "0-immediate");
assertEquals(await promises[1], "1-discarded");
assertEquals(await promises[2], "2-discarded");
assertEquals(await promises[3], "3-delayed");
assertEquals(await throttledFn(4), "4-immediate");
await throttledFn.ready;
assertEquals(await throttledFn(5), "5-immediate");
await throttledFn.ready;
```
