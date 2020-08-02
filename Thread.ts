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

  public onMessage(callback: (e: T) => void) {
    this.worker.onmessage = (e)=>callback(e.data);
  }
  private populateFile(code: Function) {
    console.log(`Writing to file ${this.fileName}`);
    Deno.writeTextFileSync(
      this.fileName,
      `
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`
    );
  }
  private init() {
    addEventListener("unload", () => Deno.removeSync(this.fileName));
  }

  public postMessage(msg: any) {
    this.worker.postMessage(msg);
  }
}
