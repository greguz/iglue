/**
 * Generic collection object
 */

export interface Collection<T = any> {
  [key: string]: T;
}

/**
 * Generic map function
 */

export type Mapper<A, B> = (arg: A) => B;

/**
 * Like Array.prototype.findIndex
 */

export function findIndex<T>(obj: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
  for (let i = 0; i < obj.length; i++) {
    if (predicate(obj[i], i, obj) === true) {
      return i;
    }
  }
  return -1;
}

/**
 * Like Array.prototype.find
 */

export function find<T>(obj: T[], predicate: (value: T, index: number, obj: T[]) => boolean): T {
  for (let i = 0; i < obj.length; i++) {
    if (predicate(obj[i], i, obj) === true) {
      return obj[i];
    }
  }
  return undefined;
}

/**
 * Like Object.assign but wihout symbols
 */

export function assign<T>(target: T): T;
export function assign<T, S>(target: T, source: S): T & S;
export function assign<T, S0, S1>(target: T, s0: S0, s1: S1): T & S0 & S1;
export function assign<T, S0, S1, S2>(target: T, s0: S0, s1: S1, s2: S2): T & S0 & S1 & S2;
export function assign<T, S0, S1, S2, S3>(target: T, s0: S0, s1: S1, s2: S2, s3: S3): T & S0 & S1 & S2 & S3;
export function assign(target: any, ...sources: any[]): any {
  if (target === null || target === undefined) {
    throw new TypeError("Object.assign cannot be called with null or undefined");
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

/**
 * Map a collection object
 */

export function mapCollection<A, B>(collection: Collection<A>, mapper: (entry: A, prop: string) => B): Mapper<string, B> {
  return function extract(prop: string): B {
    return mapper(collection[prop], prop);
  };
}

/**
 * Returns true if the argument is an array
 */

export function isArray(arr: any): boolean {
  return arr instanceof Array;
}

/**
 * Returns true if the argument is an object
 */

export function isObject(obj: any): boolean {
  return typeof obj === "object" && obj !== null;
}

/**
 * Returns true if the argument is a function
 */

export function isFunction(fn: any): boolean {
  return typeof fn === "function";
}

/**
 * Like Array.prototype.includes
 */

export function includes<T>(arr: T[], target: T): boolean {
  for (const entry of arr) {
    if (entry === target) {
      return true;
    }
  }
  return false;
}

/**
 * Remove the targeted element, returns true if the element is removed
 */

export function remove<T>(arr: T[], target: T): boolean {
  const index: number = findIndex(
    arr,
    (entry: T): boolean => entry === target
  );
  if (index >= 0) {
    arr.splice(index, 1);
  }
  return index >= 0;
}

/**
 * Parse object path into tokens array
 */

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
      const match = path.match(/^[^\.|\[]+/);
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

/**
 * Simple passthrough function
 */

export function passthrough<T>(value: T): T {
  return value;
}

/**
 * Return a function that throw an error if called
 */

export function throwError(message: string): (...args: any[]) => any {
  return function ko(): void {
    throw new Error(message);
  };
}

/**
 * Empty function
 */

export function noop(): void {
  // nothing to do
}
