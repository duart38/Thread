import Thread from "../Thread.ts";

let count = 13;

function postMessage(e: any) {}

function tester() {
  let i = 0;
  setInterval(() => {
    postMessage(0);
  }, 500);

  return 0;
}

for (let i = 0; i < count; i++) {
  new Thread(tester, "module").onMessage((d) => console.log(`thread -> ${i}`))
    .postMessage(0);
}
