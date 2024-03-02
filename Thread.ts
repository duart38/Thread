/**
 * > Type T -> return type
 *
 * > Type K -> data type of MessageEvent
 */
export default class Thread<T = unknown, K = unknown> {
  public worker: Promise<Worker>;
  private imports: Array<string>;
  private blob: Promise<Blob>;
  private blobURL = "";
  public debugMode: boolean;

  /**
   * Tells if the worker has been stopped
   */
  public stopped = false;
  /**
   * @param operation The method to be used in the thread
   * @param imports Modules to import in the worker. only JS files allowed (over the net import allowed)
   */
  constructor(
    operation: (
      e: MessageEvent<K>,
      globalObject?: Record<string, unknown>,
    ) => T | Promise<T>,
    type?: "classic" | "module",
    imports?: Array<string>,
    opts: { debug?: boolean } = { debug: false },
  ) {
    this.imports = imports || [];
    this.blob = this.populateFile(operation);
    this.worker = this.makeWorker(type);
    this.debugMode = opts.debug ?? false;
  }

  private async makeWorker(type?: "classic" | "module") {
    this.blobURL = URL.createObjectURL(await this.blob);
    return new Worker(
      this.blobURL,
      {
        type: type || "module",
      },
    );
  }

  // deno-lint-ignore ban-types
  private async populateFile(code: Function) {
    const imported = this.imports?.flatMap(async (val) =>
      (await this.copyDep(val)).join("\n")
    );
    const blobContent = `
${(await Promise.all(imported)).join("\n")}

var global = {};
var userCode = ${code.toString()}

onmessage = async function(e) {
    postMessage(await userCode(e, global));
}
`;
    this.debug(`\n\n\nBlob content:\n ${blobContent}\n\n\n`);
    return new Blob([blobContent]);
  }

  /**
   * Handles a single import line
   * @param str the import line (eg: import {som} from "lorem/ipsum.js";)
   */
  private async copyDep(str: string) {
    const importPathRegex = /('|"|`)(.+(\.js|\.ts))(\1)/ig; // for the path string ("lorem/ipsum.js")
    const importInsRegex = /(import( |))({.+}|.+)(from( |))/ig; // for the instruction before the path (import {som} from)
    const matchedPath = importPathRegex.exec(str) || "";
    this.debug("attempting to import: ", str);

    let file = false;
    let fqfn = "";

    if (
      !matchedPath[0].includes("http://") &&
      !matchedPath[0].includes("https://")
    ) {
      file = true;
      fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
      this.debug("file identified as local file");
    }
    const matchedIns = importInsRegex.exec(str) || ""; // matchedIns[0] > import {sss} from

    if (!matchedIns) {
      throw new Error(
        "The import instruction seems to be unreadable try formatting it, for example: \n" +
          "import { something } from './somet.js' \n ",
      );
    }

    if (file) {
      this.debug("importing file: ", fqfn);
      const x = await import(fqfn); //Deno.realPathSync(fqfn)
      this.debug("file imported, inlining the following: ", Object.keys(x).join(","));
      return Object.keys(x).map((v) => x[v].toString());
    } else {
      const filePath = matchedPath[0].replaceAll(/'|"/g, "");
      this.debug("importing from the net: ", filePath);
      if (filePath.endsWith(".ts")) {
        this.debug("filePath ends with .ts, returning: ", str);
        return [str]; // dont import the content if ts just paste import string
      }
      const x = await import(filePath);
      this.debug(
        "imported from the net, inlining the following: ",
        Object.keys(x).join(","),
      );
      return Object.keys(x).map((v) => x[v].toString());
    }
  }

  private debug(...msg: unknown[]) {
    if (this.debugMode) console.log(`[${new Date()}]\t`, ...msg);
  }

  /**
   * Sends data to the Thread
   * @param msg
   */
  public postMessage(msg: K): this {
    this.worker.then((w) => w.postMessage(msg));
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
    this.worker.then((w) => w.onmessage = (e) => callback(e.data));
    return this;
  }
}
