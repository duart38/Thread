export default class Thread<T> {
  public fileName: string;
  public worker: Worker;
  private imports: Array<string>;
  private folderName: string = "./tmp_threads";
  /**
   * 
   * @param operation The method to be used in the thread
   * @param imports Modules to import in the worker. only JS files allowed (over the net import allowed)
   */
  constructor(operation: (e: MessageEvent) => T, imports?: Array<string>) {
    imports?.forEach((v) => {
      if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
        throw new Error("Threaded imports do no support typescript files");
      }
    });
    this.imports = imports || [];
    this.fileName = this.createFile();
    this.populateFile(operation);
    this.worker = new Worker(new URL(this.fileName, import.meta.url).href, {
      type: "module",
    });
    this.cleanUp();
  }
  private createFile(): string {
    Deno.mkdirSync(this.folderName, { recursive: true });
    return Deno.makeTempFileSync(
      { prefix: "deno_thread_", suffix: ".js", dir: this.folderName },
    );
  }

  private populateFile(code: Function) {
    Deno.writeTextFileSync(
      this.fileName,
      `
${this.imports.join("\n")}
var userCode = ${code.toString()}

onmessage = function(e) {
    postMessage(userCode(e));
}

`,
    );
  }

  /**
   * Attempt to cleanup files
   */
  private async cleanUp() {
    await Deno.remove(this.fileName);
    try { // attempt to clean the folder in case it is empty
      await Deno.remove(this.folderName);
    } catch (error) {
    }
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
