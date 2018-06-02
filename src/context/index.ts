import { IContext } from "../interfaces/IContext";
import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { observePath } from "./path";

/**
 * Clone a context object into another one
 */

function cloneContext(source: IContext): IContext {
  const target: any = {};

  // observe directly from the "parent" context
  Object.defineProperty(target, "$observe", {
    configurable: true,
    value: function observe(path: string, callback?: IObserverCallback): IObserver {
      return source.$observe(path, callback);
    }
  });

  // clone the current context
  Object.defineProperty(target, "$clone", {
    configurable: true,
    value: function clone(): IContext {
      return cloneContext(target);
    }
  });

  // expose all enumerable properties
  for (const key in source) {
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get(): any {
        return source[key];
      },
      set(value: any): void {
        source[key] = value;
      }
    });
  }

  return target;
}

/**
 * Build a context
 */

export function buildContext(obj: object): IContext {
  if (typeof obj !== "object") {
    throw new Error("The context is not an object");
  }

  Object.defineProperty(obj, "$observe", {
    value: function observe(path: string, callback?: IObserverCallback): IObserver {
      return observePath(obj, path, callback);
    }
  });

  Object.defineProperty(obj, "$clone", {
    value: function clone(): IContext {
      return cloneContext(obj as IContext);
    }
  });

  return obj as IContext;
}
