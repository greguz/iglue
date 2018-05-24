import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { isArray, observeArray, unobserveArray } from "./array";
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
 * TODO docs
 */

function parseTokens(path: string): Token[] {
  return path.split("."); // TODO parse tokens like a.b[3].k[4][6]
}

/**
 * Create an observer
 */

export function observePath(obj: object, path: string, callback?: IObserverCallback): IObserver {
  // path tokens
  const tokens: Token[] = parseTokens(path);

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

  // private function triggered on every change
  function update(): void {
    const newValues: any[] = realize(obj, tokens);

    for (let i = 0; i <= tokens.length; i++) {
      const token: Token = tokens[i];
      const oldValue: any = oldValues[i];
      const newValue: any = newValues[i];

      if (oldValue !== newValue) {
        if (isArray(oldValue)) {
          unobserveArray(oldValue, update);
        } else if (typeof oldValue === "object" && token) {
          unobserveProperty(oldValue, token.toString(), update);
        }
        if (isArray(newValue)) {
          observeArray(newValue, update);
        } else if (typeof newValue === "object" && token && newValue !== null) {
          observeProperty(newValue, token.toString(), update);
        }
      }
    }

    callback(
      newValues[tokens.length],
      oldValues[tokens.length]
    );

    oldValues = newValues;
  }

  // start data observing
  function observe(): void {
    oldValues = realize(obj, tokens);

    for (let i = 0; i <= tokens.length; i++) {
      const token: Token = tokens[i];
      const o: any = oldValues[i];

      if (isArray(o)) {
        observeArray(o, update);
      } else if (typeof o === "object" && token && o !== null) {
        observeProperty(o, token.toString(), update);
      }
    }
  }

  // stop data observing
  function unobserve(): void {
    for (let i = 0; i <= tokens.length; i++) {
      const token: Token = tokens[i];
      const o: any = oldValues[i];

      if (isArray(o)) {
        unobserveArray(o, update);
      } else if (typeof o === "object" && token) {
        unobserveProperty(o, token.toString(), update);
      }
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
