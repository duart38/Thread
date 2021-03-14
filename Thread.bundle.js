const importMeta = {
  url: "file:///Users/duartasnel/Local/personal_projects/runLater/Thread.ts",
  main: import.meta.main,
};
class Thread {
  importsMod = [];
  stopped = false;
  constructor(operation, type, imports) {
    imports?.forEach((v) => {
      if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
        throw new Error("Threaded imports do no support typescript files");
      }
    });
    this.imports = imports || [];
    this.filePath = this.createFile();
    this.createImportsFolder();
    this.populateFile(operation);
    this.workerURL = new URL(this.filePath, importMeta.url);
    this.worker = new Worker(
      this.workerURL.href.startsWith("http")
        ? "file:" + this.workerURL.pathname
        : this.workerURL.href,
      {
        type,
      },
    );
  }
  createFile() {
    return Deno.makeTempFileSync({
      prefix: "deno_thread_",
      suffix: ".js",
    });
  }
  createImportsFolder() {
    Deno.mkdirSync(this.getTempFolder() + "threaded_imports", {
      recursive: true,
    });
  }
  populateFile(code) {
    this.imports?.forEach((val) => this.copyDep(val));
    Deno.writeTextFileSync(
      this.filePath,
      `\n${
        this.importsMod.join("\n")
      }\nvar userCode = ${code.toString()}\n\nonmessage = function(e) {\n    postMessage(userCode(e));\n}\n\n`,
    );
  }
  copyDep(str) {
    var importPathRegex = /('|"|`)(.+\.js)(\1)/ig;
    var importInsRegex = /(import( |))({.+}|.+)(from( |))/ig;
    var matchedPath = importPathRegex.exec(str) || "";
    var file = false;
    var fqfn = "";
    if (
      !matchedPath[0].includes("http://") &&
      !matchedPath[0].includes("https://")
    ) {
      file = true;
      fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
    }
    var matchedIns = importInsRegex.exec(str) || "";
    if (!matchedIns) {
      throw new Error(
        "The import instruction seems to be unreadable try formatting it, for example: \n" +
          "import { something } from './somet.js' \n ",
      );
    }
    if (file) {
      this.importsMod.push(`${matchedIns[0]} "${Deno.realPathSync(fqfn)}"`);
    } else {
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
    if (this.stopped == false) this.stop();
    try {
      return Deno.remove(this.filePath, {
        recursive: true,
      });
    } catch (err) {
      console.error(`Failed to remove worker file: ${this.filePath}`);
      console.error(err);
      return Promise.reject(`Failed to remove worker file: ${this.filePath}`);
    }
  }
  onMessage(callback) {
    this.worker.onmessage = (e) => callback(e.data);
    return this;
  }
}
export { Thread as default };
