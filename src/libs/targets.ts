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

  let number = false;
  let string = false;
  let token = false;

  for (const char of text) {
    if (number) {
      if (!isWhiteSpace(char)) {
        chunk += char;
      } else {
        if (!/^-?\d+\.?\d*$/.test(chunk)) {
          throw new Error(`Invalid number "${chunk}"`);
        }
        targets.push(primitiveTarget(parseFloat(chunk)));
        chunk = "";
        number = false;
      }
    } else if (string) {
      if (char === chunk[0]) {
        targets.push(primitiveTarget(chunk.slice(1)));
        chunk = "";
        string = false;
      } else {
        chunk += char;
      }
    } else if (token) {
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
        token = false;
      }
    } else if (!isWhiteSpace(char)) {
      chunk += char;
      number = /[-\.\d]/.test(char);
      string = char === '"' || char === "'";
      token = !number && !string;
    }
  }

  return targets;
}
