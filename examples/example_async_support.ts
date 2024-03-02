import Thread from "../Thread.ts";

/**
 * Thanks to @praswicaksono for the suggestion
 * -> https://github.com/praswicaksono
 * -> https://github.com/duart38/Thread/issues/3
 */

const thread = new Thread<number, number[]>(async (e) => {
  console.log("Worker: Message received from main script");
  const result = e.data[0] * e.data[1];
  await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  if (isNaN(result)) {
    return 0;
  } else {
    console.log("Worker: Posting message back to main script");
    return result;
  }
}, "module");

thread.onMessage((e) => {
  console.log(`recived back from thread: ${e}`);
});

thread.postMessage([10, 12]);
thread.postMessage([10, 10]);
