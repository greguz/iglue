import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { isArray } from '../utils';

import { observeArray, unobserveArray } from "./array";
import { observeProperty, unobserveProperty } from "./object";

type Token = string | number;

/**
 * Fetch current values chain
 */

function realize(obj: any, tokens: Token[]): any[] {
  const values: any[] = [];

  for (const token of tokens) {
    values.push(obj);
    if (typeof obj === "object" && obj !== null) {
      obj = obj[token];
    } else {
      obj = undefined;
    }
  }
  values.push(obj);

  return values;
}

/**
 * Parse value to into tokens
 */

function parsePath(path: string): Token[] { // TODO you can do better than this...
  const tokens: Token[] = [];

  while (path.length > 0) {
    if (path[0] === "[") {
      const end: number = path.indexOf("]");
      if (end === -1) {
        throw new Error(`"${path}" is not a valid path`);
      }
      const index: number = parseInt(path.substring(1, end), 10);
      if (isNaN(index)) {
        throw new Error(`"${path}" is not a valid path`);
      }
      tokens.push(index);
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
 * Create an observer
 */

export function observePath(obj: object, path: string, callback?: IObserverCallback): IObserver {
  // path tokens
  const tokens: Token[] = parsePath(path);

  // last chain values
  let oldValues: any[];

  // get the current value
  function get(): any {
    let o: any = obj;

    for (const token of tokens) {
      if (typeof o === "object" && o !== null) {
        o = o[token];
      } else {
        return undefined;
      }
    }

    return o;
  }

  // set the value to target
  function set(value: any): void {
    let o: any = obj;
    let i: number;

    for (i = 0; i < tokens.length - 1; i++) {
      const token: Token = tokens[i];
      if (typeof o[token] !== "object") {
        throw new Error("Unable to set the target object");
      }
      o = o[token];
    }

    o[tokens[i]] = value;
  }

  // observe/unobserve registration utility
  function register(action: "observe" | "unobserve", value: any, token: Token, fn: () => void): void {
    if (token === undefined) {
      if (isArray(value)) {
        (action === "observe" ? observeArray : unobserveArray)(value, fn);
      }
    } else if (typeof value === "object" && value !== null) {
      if (isArray(value) && (typeof token === "number" || token === "length")) {
        (action === "observe" ? observeArray : unobserveArray)(value, fn);
      } else {
        (action === "observe" ? observeProperty : unobserveProperty)(value, token.toString(), fn);
      }
    }
  }

  // private function triggered on every change
  function update(): void {
    const newValues: any[] = realize(obj, tokens);

    for (let i = 0; i <= tokens.length; i++) {
      const token: Token = tokens[i];
      const oldValue: any = oldValues[i];
      const newValue: any = newValues[i];

      if (oldValue !== newValue) {
        register("unobserve", oldValue, token, update);
        register("observe", newValue, token, update);
      }
    }

    callback(newValues[tokens.length], oldValues[tokens.length]);

    oldValues = newValues;
  }

  // start data observing
  function observe(): void {
    oldValues = realize(obj, tokens);

    for (let i = 0; i <= tokens.length; i++) {
      register(
        "observe",
        oldValues[i],
        tokens[i],
        update
      );
    }
  }

  // stop data observing
  function unobserve(): void {
    for (let i = 0; i <= tokens.length; i++) {
      register(
        "unobserve",
        oldValues[i],
        tokens[i],
        update
      );
    }

    oldValues = undefined;
  }

  // register notification callback
  function notify(fn: IObserverCallback): void {
    if (fn && callback == null) {
      observe();
    } else if (fn == null && callback) {
      unobserve();
    }
    callback = fn;
  }

  // register the constructor callback
  if (callback) {
    observe();
  }

  // return the observer instance
  return {
    get,
    set,
    notify
  };
}
