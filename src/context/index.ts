import { IContext } from "../interfaces/IContext";
import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { observePath } from "./path";

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
 * Build a context
 */

export function buildContext(obj: any): IContext {
  // ensure object type as input
  if (typeof obj !== "object" || obj === null) {
    throw new Error("The context is not an object");
  }

  // use $clone API if is already a context
  if (obj.hasOwnProperty("$clone")) {
    return obj.$clone();
  }

  // resulting context object
  const context: any = {};

  // clone all currently enumerable properties
  for (const prop in obj) {
    exposeProperty(obj, prop, context);
  }

  // define the clone utility
  Object.defineProperty(context, "$clone", {
    configurable: true,
    // not enumerable, prevent cloning
    value: function $clone(): IContext {
      return buildContext(obj);
    }
  });

  // define the observe utility
  Object.defineProperty(context, "$observe", {
    configurable: true,
    // not enumerable, prevent cloning
    value: function $observe(path: string, callback?: IObserverCallback): IObserver {
      // get target root property to observe
      const prop = getRootProperty(path);

      // ensure bridged property
      if (!context.hasOwnProperty(prop)) {
        exposeProperty(obj, prop, context);
      }

      // start data observing
      return observePath(obj, path, callback);
    }
  });

  // return the build context
  return context;
}
