export default class Thread<T> {
  public fileName: string;
  public worker: Worker;
  constructor(operation: (e: MessageEvent) => T) {
    this.fileName = this.createFile();
    this.populateFile(operation);
    this.worker = new Worker(new URL(this.fileName, import.meta.url).href, {
      type: "module",
    });
    this.init();
  }
  private createFile(): string {
    return Deno.makeTempFileSync({ prefix: "deno_thread_", suffix: ".js" });
  }

  private populateFile(code: Function) {
    Deno.writeTextFileSync(
      this.fileName,
      `
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`,
    );
  }

  private init() {
    addEventListener("unload", () => Deno.removeSync(this.fileName));
  }

  /**
   * Sends data to the Thread
   * @param msg 
   */
  public postMessage(msg: any) {
    this.worker.postMessage(msg);
  }

  /**
   * Handbrakes are very handy you know
   */
  public stop() {
    this.worker.terminate();
  }

  /**
   * Bind to the worker to receive messages
   * @param callback Function that is called when the worker sends data back
   */
  public onMessage(callback: (e: T) => void) {
    this.worker.onmessage = (e) => callback(e.data);
  }
}
