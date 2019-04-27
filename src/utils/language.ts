export function noop() {}

export function isArray(value: any): value is any[] {
  return value instanceof Array;
}

export function isObject(value: any): value is Object {
  return typeof value === "object" && value !== null;
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function";
}

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function captureRegExpGroups(
  regex: RegExp,
  str: string,
  group: number = 1
) {
  if (!regex.global) {
    throw new Error();
  }
  const result: string[] = [];
  let match = regex.exec(str);
  while (match) {
    result.push(match[group] || "");
    match = regex.exec(str);
  }
  return result;
}

export function captureRegExpGroup(
  regex: RegExp,
  str: string,
  group: number = 1
): string | undefined {
  const match = regex.exec(str);
  if (match) {
    return match[group] || "";
  }
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

export function voidReducer(a: VoidFunction, b: VoidFunction): VoidFunction {
  return function c() {
    a();
    b();
  };
}
