import Thread from "../Thread.ts";
import { CallMe } from "../test_import.js";

const tr = new Thread(
  (_e) => {
    CallMe();
    return "pong";
  },
  "module",
  ['import {CallMe} from "./test_import.js"'],
);

tr.postMessage("ping");

tr.onMessage((e) => {
  console.log(e);
});
