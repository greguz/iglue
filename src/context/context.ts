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

function exposeProperty(source: any, property: string, target: any): void {
  Object.defineProperty(target, property, {
    configurable: true,
    enumerable: true,
    get(): any {
      return source[property];
    },
    set(value: any): void {
      source[property] = value;
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
    // get the source object
    const source: any = this.$source;

    // lazy props exposing
    if (!context.hasOwnProperty(property)) {
      exposeProperty(source, property, context);
    }

    // observe property
    if (source.hasOwnProperty("$observe")) {
      return source.$observe(path, callback);
    } else {
      return buildObserver(source, path, callback);
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
  for (const prop in obj) {
    exposeProperty(obj, prop, context);
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
