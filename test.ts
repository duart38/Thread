import {
  assertEquals,
  assertThrows,
  fail,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import Thread from "./Thread.ts";
import { returnNumber } from "./test_import.js";

Deno.test("incorrect file extension throws error", (): void => {
  assertThrows(() => {
    let tr = new Thread(
      (e) => {
        return 1;
      },
      "module",
      ["import Observe from 'https://raw.githubusercontent.com/duart38/Observe/master/Observe.ts'"],
    );
  });
});

Deno.test("Worker takes in external function", async () => {
  let run = new Promise((resolve) => {
    function testfunc() {
      return 1;
    }
    let t = new Thread(testfunc, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 1);
});

Deno.test("Command/Method chaining works", async () => {
  let run = new Promise((resolve) => {
    let t = new Thread((e) => 0, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(0);
  });
  assertEquals(await run, 0);
});

Deno.test("Worker returns message", async () => {
  let run = new Promise((resolve) => {
    let t = new Thread((e) => e.data, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 2);
});


Deno.test("Local file imports work", async () => {
  let run = new Promise((resolve) => {
    let t = new Thread((e) => returnNumber(), "module", [
      'import {returnNumber} from "./test_import.js"',
    ]);
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 1);
});

Deno.test("Over the network file imports work", async () => {
  let run = new Promise((resolve) => {
    let t = new Thread((e) => returnNumber(), "module", [
      'import { returnNumber } from "https://raw.githubusercontent.com/duart38/Thread/master/test_import.js"',
    ]);
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(1);
  });
  assertEquals(await run, 1);
});

Deno.test("Worker has global object", async () => {
  let run = new Promise<{} | undefined>((resolve) => {
    let t = new Thread((e, glob) => glob, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(0);
  });
  assertEquals(await run, {});
});