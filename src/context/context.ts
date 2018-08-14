import { Context } from "../interfaces/Context";
import { Observer, ObserverCallback } from "../interfaces/Observer";
import { includes, isObject } from "../utils";
import { buildObserver } from "./observer";

/**
 * Get the root property name of a object value path
 */

function getRootProperty(path: string): string {
  const regex = /^[^\.\[]+/;
  if (regex.test(path)) {
    return path.match(regex)[0];
  } else {
    throw new Error("This path does not have a root property");
  }
}

/**
 * Expose an object property from another object
 */

function exposeProperty(context: Context, property: string): void {
  Object.defineProperty(context, property, {
    configurable: true,
    enumerable: true,
    get(this: Context): any {
      return this.$source[property];
    },
    set(this: Context, value: any): void {
      this.$source[property] = value;
    }
  });
}

/**
 * $observe API
 */

function $observe(this: Context, path: string, callback: ObserverCallback): Observer {
  // get the root property of this value path
  const property: string = getRootProperty(path);

  if (includes(this.$own, property)) {
    // handle own property
    return buildObserver(this, path, callback);
  } else {
    // lazy props exposing
    if (!this.hasOwnProperty(property)) {
      exposeProperty(this, property);
    }

    // observe property
    if (this.$source.hasOwnProperty("$observe")) {
      return this.$source.$observe(path, callback);
    } else {
      return buildObserver(this.$source, path, callback);
    }
  }
}

/**
 * Build a context object
 */

export function buildContext(obj: any, ownProperties?: string[]): Context {
  // validate input
  if (!isObject(obj)) {
    throw new Error("Unable to observe this value");
  }

  // resulting context object
  const context: any = {};

  // clone all currently enumerable properties
  for (const property in obj) {
    exposeProperty(context, property);
  }

  // build and return the context
  return Object.defineProperties(context, {
    $source: {
      value: obj
    },
    $own: {
      value: ownProperties || []
    },
    $observe: {
      value: $observe
    }
  });
}
