import Thread from "../Thread.ts";
import Observe from "https://raw.githubusercontent.com/duart38/Observe/master/Observe.ts";

const tr = new Thread<string, string>(
  (e) => {
    const t = new Observe(e.data); // observable values
    return t.getValue();
  },
  "module",
  ["import Observe from 'https://raw.githubusercontent.com/duart38/Observe/master/Observe.bundle.js'"],
);

tr.postMessage("bing");

tr.onMessage((e) => {
  console.log(e);
});
