import { isArray, isObject, parsePath, remove } from "../utils";

import { observeArray, unobserveArray } from "./array";
import { observeProperty, unobserveProperty } from "./property";

/**
 * Observe data store property
 */

const STORE = "_ov_";

/**
 * Represents an observed object
 */

interface ObservedObject {
  [STORE]: {
    [path: string]: PathInfo;
  };
}

/**
 * Observe info
 */

interface PathInfo {
  // parsed path tokens
  t: string[];
  // update function used to observe
  u: VoidFunction;
  // registered notifiers
  n: PathNotifier[];
}

/**
 * Observe callback
 */

export type PathNotifier = (newValue: any, oldValue: any) => void;

/**
 * Fetch path values from object
 */

function realize(obj: any, tokens: string[]): any[] {
  const values: any[] = [];

  for (const token of tokens) {
    values.push(obj);
    if (isObject(obj)) {
      obj = obj[token];
    } else {
      obj = undefined;
    }
  }
  values.push(obj);

  return values;
}

/**
 * observe/unobserve registration utility
 */

function register(action: "observe" | "unobserve", value: any, token: string, fn: () => void): void {
  if (token === undefined) {
    if (isArray(value)) {
      (action === "observe" ? observeArray : unobserveArray)(value, fn);
    }
  } else if (typeof value === "object" && value !== null) {
    if (isArray(value) && (/^\d+$/.test(token) || token === "length")) {
      (action === "observe" ? observeArray : unobserveArray)(value, fn);
    } else {
      (action === "observe" ? observeProperty : unobserveProperty)(value, token.toString(), fn);
    }
  }
}

/**
 * Apply the observe middleware to the object
 */

function applyMiddleware(obj: ObservedObject, path: string, notifier: PathNotifier): void {
  // ensure object data store
  if (!obj.hasOwnProperty(STORE)) {
    Object.defineProperty(obj, STORE, {
      // not configurable, prevent double definition
      // not enumerable, prevent Object.assign cloning
      // not writable, prevent value assignation/override
      value: {}
    });
  }

  // registered notifiers
  const notifiers: PathNotifier[] = [notifier];

  // parsed path
  const tokens: string[] = parsePath(path);

  // load current values
  let oldValues: any[] = realize(obj, tokens);

  // function triggered on path change
  function update(): void {
    const newValues: any[] = realize(obj, tokens);

    for (let i = 0; i <= tokens.length; i++) {
      const token: string = tokens[i];
      const oldValue: any = oldValues[i];
      const newValue: any = newValues[i];

      if (oldValue !== newValue) {
        register("unobserve", oldValue, token, update);
        register("observe", newValue, token, update);
      }
    }

    for (const n of notifiers) {
      n(newValues[tokens.length], oldValues[tokens.length]);
    }

    oldValues = newValues;
  }

  // start data observing
  for (let i = 0; i <= tokens.length; i++) {
    register(
      "observe",
      oldValues[i],
      tokens[i],
      update
    );
  }

  // update the store
  obj[STORE][path] = {
    t: tokens,
    u: update,
    n: notifiers
  };
}

/**
 * Remove the observe middleware
 */

function removeMiddleware(obj: ObservedObject, path: string): void {
  // get path info
  const info: PathInfo = obj[STORE][path];

  // load current values
  const values: any[] = realize(obj, info.t);

  // stop data watch
  for (let i = 0; i <= info.t.length; i++) {
    register(
      "unobserve",
      values[i],
      info.t[i],
      info.u
    );
  }

  // clean store
  obj[STORE][path] = undefined;
}

/**
 * Returns true when a particular path is observed
 */

export function isObservedPath(obj: any, path: string): boolean {
  if (isObject(obj) && obj.hasOwnProperty(STORE)) {
    return !!obj[STORE][path];
  }
  return false;
}

/**
 * Observe a path value
 */

export function observePath(obj: any, path: string, notifier: PathNotifier): void {
  // input validation
  if (!isObject(obj)) {
    throw new Error("Unexpected object to observe");
  }

  // register the notifier
  if (isObservedPath(obj, path)) {
    obj[STORE][path].n.push(notifier);
  } else {
    applyMiddleware(obj, path, notifier);
  }
}

/**
 * Remove the observe notifier, returns true when the notifier is removed
 */

export function unobservePath(obj: any, path: string, notifier: PathNotifier): boolean {
  if (isObservedPath(obj, path)) {
    const info: PathInfo = obj[STORE][path];

    const removed: boolean = remove(info.n, notifier);

    if (info.n.length === 0) {
      removeMiddleware(obj, path);
    }

    return removed;
  }
  return false;
}
