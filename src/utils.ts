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
