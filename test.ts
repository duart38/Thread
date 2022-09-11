import {
  assertEquals,
  assertThrows
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import Thread from "./Thread.ts";
import { returnNumber } from "./test_import.js";

Deno.test("incorrect file extension throws error", (): void => {
  assertThrows(() => {
    const _tr = new Thread(
      (_) => {
        return 1;
      },
      "module",
      ["import Observe from 'https://raw.githubusercontent.com/duart38/Observe/master/Observe.ts'"],
    );
  });
});

Deno.test("Worker takes in external function", async () => {
  const run = new Promise((resolve) => {
    function testfunc() {
      return 1;
    }
    const t = new Thread(testfunc, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 1);
});

Deno.test("Worker async function supported", async () => {
  const run = new Promise((resolve) => {
    const t = new Thread(async ()=>{
      await new Promise((ir) => setTimeout(ir, 1000))
      return 1;
    }, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 1);
});

Deno.test("Command/Method chaining works", async () => {
  const run = new Promise((resolve) => {
    const t = new Thread((_) => 0, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(0);
  });
  assertEquals(await run, 0);
});

Deno.test("Worker returns message", async () => {
  const run = new Promise((resolve) => {
    const t = new Thread((e) => e.data, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(2);
  });
  assertEquals(await run, 2);
});


Deno.test("Local file imports work", async () => {
  const run = new Promise((resolve) => {
    const t = new Thread((_) => returnNumber(), "module", [
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
  const run = new Promise((resolve) => {
    const t = new Thread((_) => returnNumber(), "module", [
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
  // deno-lint-ignore ban-types
  const run = new Promise<{} | undefined>((resolve) => {
    const t = new Thread((_, glob) => glob, "module");
    t.onMessage((n) => {
      t.remove()?.then(() => resolve(n));
    });
    t.postMessage(0);
  });
  assertEquals(await run, {});
});