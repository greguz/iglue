import {
  Target,
  PathTarget,
  PrimitiveTarget,
  PrimitiveValue
} from "../interfaces/Target";

function pathTarget(value: string): PathTarget {
  return { type: "path", value };
}

function primitiveTarget(value: PrimitiveValue): PrimitiveTarget {
  return { type: "primitive", value };
}

function isWhiteSpace(char: string) {
  return /\s/.test(char);
}

export function parseTargets(text: string): Target[] {
  text += " ";

  const targets: Target[] = [];

  let chunk = "";

  let pNumber = false;
  let pString = false;
  let pToken = false;

  for (const char of text) {
    if (pNumber) {
      if (!isWhiteSpace(char)) {
        chunk += char;
      } else {
        if (!/^-?\d+\.?\d*$/.test(chunk)) {
          throw new Error(`Invalid number "${chunk}"`);
        }
        targets.push(primitiveTarget(parseFloat(chunk)));
        chunk = "";
        pNumber = false;
      }
    } else if (pString) {
      if (char === chunk[0]) {
        targets.push(primitiveTarget(chunk.slice(1)));
        chunk = "";
        pString = false;
      } else {
        chunk += char;
      }
    } else if (pToken) {
      if (!isWhiteSpace(char)) {
        chunk += char;
      } else {
        if (chunk === "undefined") {
          targets.push(primitiveTarget(undefined));
        } else if (chunk === "null") {
          targets.push(primitiveTarget(null));
        } else if (chunk === "true") {
          targets.push(primitiveTarget(true));
        } else if (chunk === "false") {
          targets.push(primitiveTarget(false));
        } else {
          targets.push(pathTarget(chunk));
        }
        chunk = "";
        pToken = false;
      }
    } else if (!isWhiteSpace(char)) {
      chunk += char;
      pNumber = /[-\.\d]/.test(char);
      pString = char === '"' || char === "'";
      pToken = !pNumber && !pString;
    }
  }

  return targets;
}
