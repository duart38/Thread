// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Thread {
    worker;
    imports;
    blob;
    blobURL = "";
    debugMode;
    stopped = false;
    constructor(operation, type, imports, opts = {
        debug: false
    }){
        this.debugMode = opts.debug ?? false;
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
        const blobContent = `
${(await Promise.all(imported)).join("\n")}

var global = {};
var userCode = ${code.toString()}

onmessage = async function(e) {
    postMessage(await userCode(e, global));
}
`;
        this.debug(`Blob content:${blobContent}\n\n\n`);
        return new Blob([
            blobContent
        ]);
    }
    async copyDep(str) {
        const importPathRegex = /('|"|`)(.+(\.js|\.ts))(\1)/ig;
        const importInsRegex = /(import( |))({.+}|.+)(from( |))/ig;
        const matchedPath = importPathRegex.exec(str) || "";
        this.debug("attempting to import: ", str);
        let file = false;
        let fqfn = "";
        if (!matchedPath[0].includes("http://") && !matchedPath[0].includes("https://")) {
            file = true;
            fqfn = matchedPath[0].replaceAll(/('|"|`)/ig, "");
            this.debug("file identified as local file");
        }
        const matchedIns = importInsRegex.exec(str) || "";
        if (!matchedIns) {
            throw new Error("The import instruction seems to be unreadable try formatting it, for example: \n" + "import { something } from './somet.js' \n ");
        }
        if (file) {
            this.debug("importing file: ", "file://" + fqfn);
            const x = await import("file://" + fqfn);
            this.debug("file imported, inlining the following: ", Object.keys(x).join(","));
            return Object.keys(x).map((v)=>x[v].toString());
        } else {
            const filePath = matchedPath[0].replaceAll(/'|"/g, "");
            this.debug("importing from the net: ", filePath);
            if (filePath.endsWith(".ts")) {
                this.debug("filePath ends with .ts, returning: ", str);
                return [
                    str
                ];
            }
            const x = await import(filePath);
            this.debug("imported from the net, inlining the following: ", Object.keys(x).join(","));
            return Object.keys(x).map((v)=>x[v].toString());
        }
    }
    debug(...msg) {
        if (this.debugMode) console.debug(`[${new Date()}]\t`, ...msg);
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

