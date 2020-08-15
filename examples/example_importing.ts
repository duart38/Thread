import Thread from "../Thread.ts";
import { CallMe } from '../test_import.js';

function someFunction(e: MessageEvent) {
  CallMe();
  return 1;
}
let thread = new Thread(someFunction, ["import { CallMe } from '../test_import.js'"]);
thread.onMessage((e) => {
  console.log(`recived back from thread: ${e}`);
});
thread.postMessage(999);

setInterval(()=>{
  thread.postMessage(999);
}, 4000)
