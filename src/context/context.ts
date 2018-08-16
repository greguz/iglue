import { Context } from "../interfaces/Context";
import { includes, isObject } from "../utils";
import { observePath, unobservePath, PathNotifier } from "./path";

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

function $observe(this: Context, path: string, callback: PathNotifier): void {
  // get the root property of this value path
  const property: string = getRootProperty(path);

  if (includes(this.$own, property)) {
    // handle own property
    observePath(this, path, callback);
  } else {
    // lazy props exposing
    if (!this.hasOwnProperty(property)) {
      exposeProperty(this, property);
    }

    // observe property
    if (this.$source.hasOwnProperty("$observe")) {
      this.$source.$observe(path, callback);
    } else {
      observePath(this.$source, path, callback);
    }
  }
}

/**
 * $unobserve API
 */

function $unobserve(this: Context, path: string, callback: PathNotifier): void {
  const property: string = getRootProperty(path);

  if (includes(this.$own, property)) {
    unobservePath(this, path, callback);
  } else if (this.$source.hasOwnProperty("$unobserve")) {
    this.$source.$unobserve(path, callback);
  } else {
    unobservePath(this.$source, path, callback);
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
    },
    $unobserve: {
      value: $unobserve
    }
  });
}
