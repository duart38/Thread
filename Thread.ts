export default class Thread<T> {
  public fileName: string;
  private workerURL: URL;
  public worker: Worker;
  private imports: Array<string>;
  private importsMod: Array<string> = [];
  /**
   * Tells if the worker has been stopped
   */
  public stopped = false;
  /**
   * 
   * @param operation The method to be used in the thread
   * @param imports Modules to import in the worker. only JS files allowed (over the net import allowed)
   */
  constructor(
    operation: (e: MessageEvent) => T,
    imports?: Array<string>,
    deno?: boolean,
  ) {
    imports?.forEach((v) => {
      if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
        throw new Error("Threaded imports do no support typescript files");
      }
    });
    this.imports = imports || [];
    this.fileName = this.createFile();
    this.populateFile(operation);
    this.workerURL = new URL(this.fileName, import.meta.url);

    this.worker = new Worker(this.workerURL.href.startsWith("http") ? "file:"+this.workerURL.pathname : this.workerURL.href, {
      type: "module",
      deno,
    });
  }
  private createFile(): string {
    return Deno.makeTempFileSync(
      { prefix: "deno_thread_", suffix: ".js" },
    );
  }

  private populateFile(code: Function) {
    this.imports?.forEach((val) => this.copyDep(val));
    Deno.writeTextFileSync(
      this.fileName,
      `
${this.importsMod.join("\n")}
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`,
    );
  }

  /**
   * Handles a single import line
   * @param str the import line (eg: import {som} from "lorem/ipsum.js";)
   */
  private copyDep(str: string) {
    var importPathRegex = /('|"|`)(.+\.js)(\1)/ig; // for the path string ("lorem/ipsum.js")
    var importInsRegex = /(import( |))({.+}|.+)(from( |))/ig; // for the instruction before the path (import {som} from)
    var importFileName = /(\/\w+.js)/ig; // for the file name that was copied (/ipsum.js)  !note the slash before the fn
    var matchedPath = importPathRegex.exec(str) || "";
    var file = false;

    if (
      !matchedPath[0].includes("http://") &&
      !matchedPath[0].includes("https://")
    ) {
      file = true;
      var fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
      Deno.copyFileSync(fqfn, this.getTempFolder() + fqfn);
    }
    var matchedIns = importInsRegex.exec(str) || ""; // matchedIns[0] > import {sss} from

    if (file) {
      this.importsMod.push(`${matchedIns[0]} ".${str.match(importFileName)}"`);
    } else {
      this.importsMod.push(`${matchedIns[0]} ${matchedPath[0]}`);
    }
  }

  private getTempFolder() {
    let t = this.fileName;
    return t.replace(/(\/\w+.js)/ig, "/");
  }

  /**
   * Sends data to the Thread
   * @param msg 
   */
  public postMessage(msg: any): this{
    this.worker.postMessage(msg);
    return this;
  }

  /**
   * Handbrakes are very handy you know
   * NOTE: calls remove()
   */
  public stop() {
    this.stopped = true;
    this.worker.terminate();
  }

  /**
   * Removes the current worker file from the temporary folder
   * NOTE: Can be used while the program is running (calls stop()..)
   */
  public remove(){
    if(this.stopped == false) this.stop();
    try{
      Deno.removeSync(this.fileName, {recursive: true});
    }catch(err){
      console.error(`Failed to remove worker file: ${this.fileName}`)
      console.error(err);
    }
  }

  /**
   * Bind to the worker to receive messages
   * @param callback Function that is called when the worker sends data back
   */
  public onMessage(callback: (e: T) => void): this {
    this.worker.onmessage = (e) => callback(e.data);
    return this;
  }
}
