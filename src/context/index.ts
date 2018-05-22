import { IContext } from "../interfaces/IContext";
import { IObserver, IObserverCallback } from "../interfaces/IObserver";

import { observePath } from "./path";

function wrapObserverCallback(callback: IObserverCallback, isObserving: () => boolean): IObserverCallback {
  return function wrapper(newValue: any, oldValue: any): void {
    if (isObserving()) {
      callback(newValue, oldValue);
    }
  };
}

function wrapObserver(observer: IObserver, isObserving: () => boolean): IObserver {
  return {
    get: observer.get,
    set: observer.set,
    notify(callback: IObserverCallback): void {
      observer.notify(
        callback ? wrapObserverCallback(callback, isObserving) : null
      );
    }
  };
}

export function buildContext<T extends object = any>(obj: T): IContext<T> {
  if (typeof obj !== "object") {
    throw new Error("The context is not an object");
  }

  let observing: boolean = false;

  function isObserving(): boolean {
    return observing;
  }

  Object.defineProperty(obj, "$start", {
    enumerable: false,
    writable: false,
    configurable: true,
    value: function start(): void {
      observing = true;
    }
  });

  Object.defineProperty(obj, "$stop", {
    enumerable: false,
    writable: false,
    configurable: true,
    value: function stop(): void {
      observing = false;
    }
  });

  Object.defineProperty(obj, "$observe", {
    enumerable: false,
    writable: false,
    configurable: true,
    value: function observe(path: string, callback?: IObserverCallback): IObserver {
      return wrapObserver(observePath(obj, path, callback), isObserving);
    }
  });

  return obj as any;
}
