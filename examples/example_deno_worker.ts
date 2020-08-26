import Thread from "../Thread.ts";
import Observe from "https://raw.githubusercontent.com/duart38/Observe/master/Observe.ts";

let tr = new Thread((e)=>{
  let t = new Observe(e.data); // observable values
  return t.getValue()
}, ["import Observe from 'https://raw.githubusercontent.com/duart38/Observe/master/Observe.bundle.js'"], true) // true enables deno

tr.postMessage("bing");

tr.onMessage((e)=>{
  console.log(e);
});

