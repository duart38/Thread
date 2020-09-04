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
                constructor(operation, imports, deno) {
                    this.importsMod = [];
                    this.stopped = false;
                    imports?.forEach((v) => {
                        if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
                            throw new Error("Threaded imports do no support typescript files");
                        }
                    });
                    this.imports = imports || [];
                    this.filePath = this.createFile();
                    this.createImportsFolder();
                    this.populateFile(operation);
                    this.workerURL = new URL(this.filePath, context_1.meta.url);
                    this.worker = new Worker(this.workerURL.href.startsWith("http") ? "file:" + this.workerURL.pathname : this.workerURL.href, {
                        type: "module",
                        deno,
                    });
                }
                createFile() {
                    return Deno.makeTempFileSync({ prefix: "deno_thread_", suffix: ".js" });
                }
                createImportsFolder() {
                    Deno.mkdirSync(this.getTempFolder() + "threaded_imports", { recursive: true });
                }
                populateFile(code) {
                    this.imports?.forEach((val) => this.copyDep(val));
                    Deno.writeTextFileSync(this.filePath, `
${this.importsMod.join("\n")}
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`);
                }
                copyDep(str) {
                    var importPathRegex = /('|"|`)(.+\.js)(\1)/ig;
                    var importInsRegex = /(import( |))({.+}|.+)(from( |))/ig;
                    var matchedPath = importPathRegex.exec(str) || "";
                    var file = false;
                    var fqfn = "";
                    if (!matchedPath[0].includes("http://") &&
                        !matchedPath[0].includes("https://")) {
                        file = true;
                        fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
                    }
                    var matchedIns = importInsRegex.exec(str) || "";
                    if (!matchedIns)
                        throw new Error("The import instruction seems to be unreadable try formatting it, for example: \n"
                            + "import { something } from './somet.js' \n ");
                    if (file) {
                        this.importsMod.push(`${matchedIns[0]} "${Deno.realPathSync(fqfn)}"`);
                    }
                    else {
                        this.importsMod.push(`${matchedIns[0]} ${matchedPath[0]}`);
                    }
                }
                getTempFolder() {
                    let t = this.filePath;
                    return t.replace(/(\/\w+.js)/ig, "/");
                }
                postMessage(msg) {
                    this.worker.postMessage(msg);
                    return this;
                }
                stop() {
                    this.stopped = true;
                    this.worker.terminate();
                }
                remove() {
                    if (this.stopped == false)
                        this.stop();
                    try {
                        return Deno.remove(this.filePath, { recursive: true });
                    }
                    catch (err) {
                        console.error(`Failed to remove worker file: ${this.filePath}`);
                        console.error(err);
                    }
                }
                onMessage(callback) {
                    this.worker.onmessage = (e) => callback(e.data);
                    return this;
                }
            };
            exports_1("default", Thread);
        }
    };
});

const __exp = __instantiate("Thread", false);
export default __exp["default"];
