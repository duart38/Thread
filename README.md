![alt text](https://github.com/duart38/Thread/blob/master/th_logo.png?raw=true "Logo Title Text 1")

> Please note that this module is very much early in development. Things might... break...

[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/Thread)

1. This module allows you to write **Web Worker** code inline with the rest of your code
2. This module is also somewhat type safe
3. Allows you to Thread already existing functions
4. Supports Deno unstable features
5. Allows module imports inside the worker

## example
```typescript
let thread = new Thread<number>((e: MessageEvent)=>{
    console.log('Worker: Message received from main script');
    const result = e.data[0] * e.data[1];
    if (isNaN(result)) {
      return 0;
    } else {
      console.log('Worker: Posting message back to main script');
      return(result);
    }
});

thread.onMessage((e)=>{
    console.log(`back from thread: ${e}`)
})
thread.postMessage([10, 12])
```
Instead of using the workers postMessage() method we return value from withing our method

**Here's a few more examples**
```typescript
function someFunction(e: MessageEvent){
  return 0;
}

new Thread((e: MessageEvent)=>{return 0}); // inline Thread with return type of number
new Thread(someFunction); // thread an already existing function
new Thread(someFunction, ['import Something from "../some.bundle.js";']); // thread with custom importing
```
