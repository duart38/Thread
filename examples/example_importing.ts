import Thread from "../Thread.ts";
import {CallMe} from "../test_import.js"

let tr = new Thread((e)=>{
  CallMe();
  return "pong"
}, "module", ['import {CallMe} from "./test_import.js"'])

tr.postMessage("ping");

tr.onMessage((e)=>{
  console.log(e);
});

