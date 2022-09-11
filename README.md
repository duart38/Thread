![alt text](https://github.com/duart38/Thread/blob/master/th_logo.png?raw=true "Logo Title Text 1")


[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/Thread)
![alt text](https://img.shields.io/github/license/duart38/Thread?color=blue "License")
![alt text](https://img.shields.io/github/v/release/duart38/Thread?color=red "Release")
![alt text](https://img.shields.io/github/workflow/status/duart38/Thread/Test%20module?label=Tests "Tests")



1. This module allows you to write **Web Worker** code inline with the rest of your code
2. This module is also somewhat type safe
3. Allows you to Thread already existing functions
5. Allows module imports inside the worker

## Examples
> See examples folder for more examples

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
}, "module");

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

new Thread((e: MessageEvent)=>{return 0}, "module"); // inline Thread with return type of number
new Thread(someFunction, "module"); // thread an already existing function
new Thread(someFunction, "module", ['import Something from "../some.bundle.js";']); // thread with custom importing
```

**Async support**
```TypeScript
const thread = new Thread<string, number>(async (_) => {
  console.log("Worker: Message received from main script");
  // Some async logic...
  await new Promise((ir) => setTimeout(ir, 2000));
  return "DONE";
}, "module");

thread.onMessage((e) => {
  console.log(`recived back from thread: ${e}`);
});

thread.postMessage(0);
```

## API

### Standard API
| Method / variable                  	| Description                                                                                                                	|
|------------------------------------	|----------------------------------------------------------------------------------------------------------------------------
| worker                             	| The Worker.                                                                                                                	|
| stopped                            	| Tells if the worker has been stopped                                                                                       	|
| postMessage(msg)                   	| Sends data to the Thread                                                                                                   	|
| stop()                             	| calls terminate on the worker.                                                                                             	|
| remove()                           	| Removes the current worker file from the temporary folder. NOTE: Can be used while the program is running (calls stop()..) 	|
| onMessage(callback: (e: T) =>void) 	| Bind to the worker to receive messages                                                                                     	|
