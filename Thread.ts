export default class Thread<T> {
  public worker: Promise<Worker>;
  private imports: Array<string>;
  private blob: Promise<Blob>;
  private blobURL: string = "";
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
    operation: (e: MessageEvent, globalObject?:{}) => T,
    type?: "classic" | "module",
    imports?: Array<string>,
  ) {
    imports?.forEach((v) => {
      if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
        throw new Error("Threaded imports do no support typescript files");
      }
    });
    this.imports = imports || [];
    this.blob = this.populateFile(operation);
    this.worker = this.makeWorker(type);
  }

  private async makeWorker(type?: "classic" | "module"){
    this.blobURL = URL.createObjectURL(await this.blob)
    return new Worker(
      this.blobURL,
      {
        type: type || "module",
      },
    );
  }

  private async populateFile(code: Function) {
    let imported = this.imports?.flatMap(async (val) => (await this.copyDep(val)).join("\n"));
    return new Blob([`
    ${(await Promise.all(imported)).join("\n")}
    
    var global = {};
    var userCode = ${code.toString()}
    
    onmessage = function(e) {
        postMessage(userCode(e, global));
    }
    
    `]);
  }

  /**
   * Handles a single import line
   * @param str the import line (eg: import {som} from "lorem/ipsum.js";)
   */
  private async copyDep(str: string) {
    var importPathRegex = /('|"|`)(.+\.js)(\1)/ig; // for the path string ("lorem/ipsum.js")
    var importInsRegex = /(import( |))({.+}|.+)(from( |))/ig; // for the instruction before the path (import {som} from)
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
    var matchedIns = importInsRegex.exec(str) || ""; // matchedIns[0] > import {sss} from

    if (!matchedIns) {
      throw new Error(
        "The import instruction seems to be unreadable try formatting it, for example: \n" +
          "import { something } from './somet.js' \n ",
      );
    }

    
    if (file) {
      let x = await import(fqfn); //Deno.realPathSync(fqfn)
      return Object.keys(x).map((v)=>x[v].toString())
    } else {
      let x = await import(matchedPath[0].replaceAll(/'|"/g,""));
      return Object.keys(x).map((v)=>x[v].toString())
    }
  }

  /**
   * Sends data to the Thread
   * @param msg 
   */
  public postMessage(msg: any): this {
    this.worker.then(w=>w.postMessage(msg));
    return this;
  }

  /**
   * Handbrakes are very handy you know
   */
  public async stop() {
    this.stopped = true;
    (await this.worker).terminate();
  }

  /**
   * Stops the worker and revokes the blob URL.
   * NOTE: Can be used while the program is running (calls stop()..)
   */
  public async remove() {
    if (this.stopped == false) await this.stop();
    URL.revokeObjectURL(this.blobURL);
  }

  /**
   * Bind to the worker to receive messages
   * @param callback Function that is called when the worker sends data back
   */
  public onMessage(callback: (e: T) => void): this {
    this.worker.then(w=>w.onmessage = (e) => callback(e.data));
    return this;
  }
}
