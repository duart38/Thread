import Thread from "../Thread.ts";

let thread = new Thread<number>((e: MessageEvent) => {
  console.log("Worker: Message received from main script");
  const result = e.data[0] * e.data[1];
  if (isNaN(result)) {
    return 0;
  } else {
    console.log("Worker: Posting message back to main script");
    return (result);
  }
});

thread.onMessage((e) => {
  console.log(`recived back from thread: ${e}`);
});
thread.postMessage([10, 12]);

//thread.stop();
