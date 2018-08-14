import { Observer, ObserverCallback } from "../interfaces/Observer";
import { isObject, parsePath } from "../utils";
import { observePath, unobservePath } from "./path";

/**
 * TODO docs
 */

function buildValueGetter(obj: any, tokens: string[]): () => any {
  return function get(): any {
    let o: any = obj;

    for (const token of tokens) {
      if (isObject(o)) {
        o = o[token];
      } else {
        return undefined;
      }
    }

    return o;
  };
}

/**
 * TODO docs
 */

function buildValueSetter(obj: any, tokens: string[]): (value: any) => void {
  return function set(value: any): void {
    let o: any = obj;
    let i: number;

    for (i = 0; i < tokens.length - 1; i++) {
      const token: string = tokens[i];
      if (!isObject(o[token])) {
        throw new Error("Unable to set the target object");
      }
      o = o[token];
    }

    o[tokens[i]] = value;
  };
}

/**
 * Create a new observer instance
 */

export function buildObserver(obj: any, path: string, callback: ObserverCallback): Observer {
  if (typeof callback !== "function" && callback !== null) {
    throw new Error("The observer callback must be a function or null");
  }
  if (callback) {
    observePath(obj, path, callback);
  }
  const tokens: string[] = parsePath(path);
  return {
    get: buildValueGetter(obj, tokens),
    set: buildValueSetter(obj, tokens),
    unobserve(): void {
      if (callback) {
        unobservePath(obj, path, callback);
      }
    }
  };
}
