class Thread {
    worker;
    imports;
    blob;
    blobURL = "";
    stopped = false;
    constructor(operation, type1, imports){
        imports?.forEach((v)=>{
            if (v.endsWith(".ts'") || v.endsWith('.ts"')) {
                throw new Error("Threaded imports do no support typescript files");
            }
        });
        this.imports = imports || [];
        this.blob = this.populateFile(operation);
        this.worker = this.makeWorker(type1);
    }
    async makeWorker(type) {
        this.blobURL = URL.createObjectURL(await this.blob);
        return new Worker(this.blobURL, {
            type: type || "module"
        });
    }
    async populateFile(code) {
        let imported = this.imports?.flatMap(async (val)=>(await this.copyDep(val)).join("\n")
        );
        return new Blob([
            `\n    ${(await Promise.all(imported)).join("\n")}\n    \n    var global = {};\n    var userCode = ${code.toString()}\n    \n    onmessage = function(e) {\n        postMessage(userCode(e, global));\n    }\n    \n    `
        ]);
    }
    async copyDep(str) {
        var importPathRegex = /('|"|`)(.+\.js)(\1)/ig;
        var importInsRegex = /(import( |))({.+}|.+)(from( |))/ig;
        var matchedPath = importPathRegex.exec(str) || "";
        var file = false;
        var fqfn = "";
        if (!matchedPath[0].includes("http://") && !matchedPath[0].includes("https://")) {
            file = true;
            fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
        }
        var matchedIns = importInsRegex.exec(str) || "";
        if (!matchedIns) {
            throw new Error("The import instruction seems to be unreadable try formatting it, for example: \n" + "import { something } from './somet.js' \n ");
        }
        if (file) {
            let x = await import(fqfn);
            return Object.keys(x).map((v)=>x[v].toString()
            );
        } else {
            let x = await import(matchedPath[0].replaceAll(/'|"/g, ""));
            return Object.keys(x).map((v)=>x[v].toString()
            );
        }
    }
    postMessage(msg) {
        this.worker.then((w)=>w.postMessage(msg)
        );
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
        this.worker.then((w)=>w.onmessage = (e)=>callback(e.data)
        );
        return this;
    }
}
export { Thread as default };
