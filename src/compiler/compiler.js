import { parse, generate } from "./index.js";

export function compile(content) {
  const context = parse(content)
  return generate(context)
}