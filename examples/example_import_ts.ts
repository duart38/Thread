import { plus } from "https://deno.land/x/math@v1.1.0/mod.ts";
import Thread from "../Thread.ts";

const tr = new Thread(
  (e) => {
    return plus(e.data as number, 1);
  },
  "module",
  ['import { plus } from "https://deno.land/x/math@v1.1.0/mod.ts"'],
);

tr.postMessage(1);

tr.onMessage((e) => {
  console.log(e);
});
