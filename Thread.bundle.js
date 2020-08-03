// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiate;
(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };
  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }
  __instantiate = (m, a) => {
    System = __instantiate = undefined;
    rF(m);
    return a ? gExpA(m) : gExp(m);
  };
})();

System.register("Thread", [], function (exports_1, context_1) {
    "use strict";
    var Thread;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Thread = class Thread {
                constructor(operation, imports) {
                    this.imports = imports || [];
                    this.fileName = this.createFile();
                    this.populateFile(operation);
                    this.worker = new Worker(new URL(this.fileName, context_1.meta.url).href, {
                        type: "module",
                    });
                    this.init();
                }
                createFile() {
                    Deno.mkdirSync("./tmp_threads", { recursive: true });
                    return Deno.makeTempFileSync({ prefix: "deno_thread_", suffix: ".js", dir: "./tmp_threads" });
                }
                populateFile(code) {
                    Deno.writeTextFileSync(this.fileName, `
${this.imports.join("\n")}
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`);
                }
                init() {
                    addEventListener("unload", () => Deno.removeSync(this.fileName));
                }
                postMessage(msg) {
                    this.worker.postMessage(msg);
                }
                stop() {
                    this.worker.terminate();
                }
                onMessage(callback) {
                    this.worker.onmessage = (e) => callback(e.data);
                }
            };
            exports_1("default", Thread);
        }
    };
});

const __exp = __instantiate("Thread", false);
export default __exp["default"];