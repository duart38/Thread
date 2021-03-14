import {
    assertEquals,
    fail,
    assertThrows
  } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import Thread from "./Thread.ts";
import { returnNumber } from "./test_import.js";


  Deno.test("incorrect file extension throws error", (): void => {
    assertThrows(()=>{
        let tr = new Thread((e)=>{return 1}, "module", ["import Observe from 'https://raw.githubusercontent.com/duart38/Observe/master/Observe.ts'"]);
    });
    assertThrows(()=>{
        let tr = new Thread((e)=>{return 1}, "module", ["import {cleanWorkerFolder} from './utils.ts'"]);
    });
  })


  Deno.test("Worker takes in external function", async () => {
    let run = new Promise((resolve)=>{
      function testfunc(){return 1}
      let t = new Thread(testfunc, "module");
      t.onMessage((n)=>{
        t.remove()?.then(()=>resolve(n));
      });
      t.postMessage(2);
    });
    assertEquals(await run, 1);
  })

  Deno.test("Command/Method chaining works", async () => {
    let run = new Promise((resolve)=>{
      let t = new Thread((e)=>0, "module");
      t.onMessage((n)=>{
        t.remove()?.then(()=>resolve(n));
      });
      t.postMessage(0);
    })
    assertEquals(await run, 0)
  })

  Deno.test("Worker returns message", async () => {
    let run = new Promise((resolve)=>{
      let t =  new Thread((e)=>e.data, "module");
      t.onMessage((n)=>{
        t.remove()?.then(()=>resolve(n));
      });
      t.postMessage(2);
    })
    assertEquals(await run, 2)
  });

  Deno.test("Worker cleans itself up", async() => {
    let t = new Thread((e)=>0, "module");
    await t.remove();
    assertThrows(()=>Deno.readFileSync(t.filePath))
  })


  Deno.test("Local file imports work",  async () => {
    let run = new Promise((resolve)=>{
      let t =  new Thread((e)=>returnNumber(), "module", ['import {returnNumber} from "./test_import.js"']);
      t.onMessage((n)=>{
        t.remove()?.then(()=>resolve(n));
      });
      t.postMessage(2);
    })
    assertEquals(await run, 1)
  })

  Deno.test("Over the new file imports work",  async () => {
    let run = new Promise((resolve)=>{
      let t =  new Thread((e)=> returnNumber(), "module", ['import { returnNumber } from "https://raw.githubusercontent.com/duart38/Thread/master/test_import.js"']);
      t.onMessage((n)=>{
        t.remove()?.then(()=>resolve(n));
      });
      t.postMessage(1);
    })
    assertEquals(await run, 1)
  })