import { printer } from "./nested/imptwo.js";

export function add(a, b){
    printer(`adding ${a} and ${b} together -> : ${a + b}`);
    return a + b;
}