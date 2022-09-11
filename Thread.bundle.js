// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Thread {
    worker;
    imports;
    blob;
    blobURL = "";
    stopped = false;
    constructor(operation, type, imports){
        imports?.forEach((v)=>{
            if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
                throw new Error("Threaded imports do no support typescript files");
            }
        });
        this.imports = imports || [];
        this.blob = this.populateFile(operation);
        this.worker = this.makeWorker(type);
    }
    async makeWorker(type) {
        this.blobURL = URL.createObjectURL(await this.blob);
        return new Worker(this.blobURL, {
            type: type || "module"
        });
    }
    async populateFile(code) {
        const imported = this.imports?.flatMap(async (val)=>(await this.copyDep(val)).join("\n"));
        return new Blob([
            `
    ${(await Promise.all(imported)).join("\n")}
    
    var global = {};
    var userCode = ${code.toString()}
    
    onmessage = async function(e) {
        postMessage(await userCode(e, global));
    }
    
    `
        ]);
    }
    async copyDep(str) {
        const importPathRegex = /('|"|`)(.+\.js)(\1)/ig;
        const importInsRegex = /(import( |))({.+}|.+)(from( |))/ig;
        const matchedPath = importPathRegex.exec(str) || "";
        let file = false;
        let fqfn = "";
        if (!matchedPath[0].includes("http://") && !matchedPath[0].includes("https://")) {
            file = true;
            fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
        }
        const matchedIns = importInsRegex.exec(str) || "";
        if (!matchedIns) {
            throw new Error("The import instruction seems to be unreadable try formatting it, for example: \n" + "import { something } from './somet.js' \n ");
        }
        if (file) {
            const x = await import(fqfn);
            return Object.keys(x).map((v)=>x[v].toString());
        } else {
            const x1 = await import(matchedPath[0].replaceAll(/'|"/g, ""));
            return Object.keys(x1).map((v)=>x1[v].toString());
        }
    }
    postMessage(msg) {
        this.worker.then((w)=>w.postMessage(msg));
        return this;
    }
    async stop() {
        this.stopped = true;
        (await this.worker).terminate();
    }
    async remove() {
        if (this.stopped == false) await this.stop();
        URL.revokeObjectURL(this.blobURL);
    }
    onMessage(callback) {
        this.worker.then((w)=>w.onmessage = (e)=>callback(e.data));
        return this;
    }
}
export { Thread as default };
