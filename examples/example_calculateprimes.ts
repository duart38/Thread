import Thread from "../Thread.ts";

const count = 2; // number of threads to spawn

function postMessage(e: any) {} // stops the compiler from complaining that the method is not available.. this gets pasted in the worker

function tester() {
  function calculatePrimes() {
    const iterations = 50;
    const multiplier = 100000000000;
    const primes = [];
    for (let i = 0; i < iterations; i++) {
      const candidate = i * (multiplier * Math.random());
      let isPrime = true;
      for (let c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        primes.push(candidate);
      }
    }
    return primes;
  }
  setInterval(() => {
    postMessage(calculatePrimes());
  }, 500);

  return 0;
}

for (let i = 0; i < count; i++) {
  new Thread(tester, "module").onMessage((d) =>
    console.log(`thread -> ${i} : ${d}`)
  ).postMessage(0);
}

setInterval(() => console.log("\n\n\n I'm not blocked \n\n\n"), 100);
