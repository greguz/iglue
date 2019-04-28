import { isNil } from "./language";

export function assign<T>(target: T): T;
export function assign<T, S0>(target: T, s0: S0): T & S0;
export function assign<T, S0, S1>(target: T, s0: S0, s1: S1): T & S0 & S1;
export function assign(target: any, ...sources: any[]): any {
  if (isNil(target)) {
    throw new TypeError(
      "Object.assign cannot be called with null or undefined"
    );
  }

  const to: any = Object(target);

  for (const source of sources) {
    const from: any = Object(source);

    for (const key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
  }

  return to;
}

export function parsePath(path: string): string[] {
  // TODO you can do better than this...
  const tokens: string[] = [];
  while (path.length > 0) {
    if (path[0] === "[") {
      const end: number = path.indexOf("]");
      if (end === -1) {
        throw new Error(`"${path}" is not a valid path`);
      }
      tokens.push(path.substring(1, end));
      path = path.substr(end + 1);
    } else {
      const match: any = path.match(/^[^\.|\[]+/);
      const token: string = match[0];
      tokens.push(token);
      path = path.substr(token.length);
    }
    if (path[0] === ".") {
      path = path.substr(1);
    }
  }
  return tokens;
}
