import { Context } from "../interfaces/Context";

import { includes } from "../utils/array";
import { isObject } from "../utils/language";
import { parsePath } from "../utils/object";

import { observePath, PathNotifier, unobservePath } from "./path";

/**
 * Get the root property name of a object value path
 */
function getRootProperty(path: string): string {
  return parsePath(path)[0];
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
  // Get the root property of this path
  const property: string = getRootProperty(path);

  if (includes(this.$own, property)) {
    // Direct observe if own property
    observePath(this, path, callback);
  } else {
    // Lazy props exposing
    if (!this.hasOwnProperty(property)) {
      exposeProperty(this, property);
    }

    if (this.$source.hasOwnProperty("$observe")) {
      // Use source context.$observe API
      this.$source.$observe(path, callback);
    } else {
      // // Observe source value
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
export function buildContext(obj: any, ownProperties: string[] = []): Context {
  if (!isObject(obj)) {
    throw new Error("Unable to observe this value");
  }

  // Resulting context object
  const context: any = {};

  // Expose all currently enumerable properties and skip owned properties
  for (const property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (!includes(ownProperties, property)) {
        exposeProperty(context, property);
      }
    }
  }

  // Build and return the context
  return Object.defineProperties(context, {
    $source: {
      value: obj
    },
    $own: {
      value: ownProperties
    },
    $observe: {
      value: $observe
    },
    $unobserve: {
      value: $unobserve
    }
  });
}
