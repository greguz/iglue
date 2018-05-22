import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { isArray } from "./array";
import { observeProperty, unobserveProperty } from "./object";

/**
 * Fetch current values chain
 */

function realize(obj: any, tokens: string[]): any[] {
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
 * Create an observer
 */

export function observePath(obj: object, path: string, callback?: IObserverCallback): IObserver {
  // path tokens
  const tokens: string[] = path.split(".");

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
      const token: string = tokens[i];
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

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const oldValue: any = oldValues[i];
      const newValue: any = newValues[i];

      if (oldValue !== newValue) {
        if (typeof oldValue === "object") {
          unobserveProperty(oldValue, token, update);
        }
        if (typeof newValue === "object" && newValue !== null) {
          observeProperty(newValue, token, update);
        }
      }
    }

    const oldValue: any = oldValues[tokens.length];
    const newValue: any = newValues[tokens.length];
    if (newValue !== oldValue || isArray(newValue)) {
      callback(newValue, oldValue);
    }

    oldValues = newValues;
  }

  // start data observing
  function observe(): void {
    oldValues = realize(obj, tokens);

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const o: any = oldValues[i];

      if (typeof o === "object" && o !== null) {
        observeProperty(
          o,
          token,
          update
        );
      }
    }
  }

  // stop data observing
  function unobserve(): void {
    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const o: any = oldValues[i];

      if (typeof o === "object") {
        unobserveProperty(
          o,
          token,
          update
        );
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
