import { add } from "./nest/impone.js";

export function CallMe() {
  console.log("I've been imported!!!!");
}
export function returnNumber() {
  return 1;
}
export function nestedTest() {
  add(1, 1);
}
