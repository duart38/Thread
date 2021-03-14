/**
 * Removes all worker related imports from the temp folder
 * WARNING: Do not run this while your program is running, it wont immediately affect it because its stored in memory but it might cause
 * some strange behaviors down the line
 */
export function cleanWorkerImports(): Promise<void> {
  let temp = Deno.makeTempFileSync({
    prefix: "deno_cleanup_handle",
    suffix: ".js",
  });
  console.log(temp.replace(/(\/\w+.js)/ig, "/") + "threaded_imports");
  Deno.removeSync(temp.replace(/(\/\w+.js)/ig, "/") + "threaded_imports", {
    recursive: true,
  });
  return Deno.remove(temp);
}
