import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const a = Buffer.from("hello");
const b = Buffer.from("hello");
const c = Buffer.from("world");

console.log("a == b:", timingSafeEqual(a, b));
console.log("a == c:", timingSafeEqual(a, c));
