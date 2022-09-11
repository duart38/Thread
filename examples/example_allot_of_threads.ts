import Thread from "../Thread.ts";

const count = 13;

function postMessage(_e: unknown) {}

function tester() {
  setInterval(() => {
    postMessage(0);
  }, 500);

  return 0;
}

for (let i = 0; i < count; i++) {
  new Thread(tester, "module").onMessage((_) => console.log(`thread -> ${i}`))
    .postMessage(0);
}
