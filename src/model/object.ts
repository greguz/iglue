import { observeArray, unobserveArray } from "./array";

// variable where to inject the property listeners
const VARIABLE = "_listeners_";

// get property descriptor from object or prototype chain
function getPropertyDescriptor(obj: object, property: string): PropertyDescriptor {
  let descriptor: PropertyDescriptor;

  // each all prototype chain
  while (obj && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(obj, property);
    obj = Object.getPrototypeOf(obj);
  }

  // set default descriptor
  if (!descriptor) {
    descriptor = {
      configurable: true,
      enumerable: true,
      writable: true,
      value: undefined
    };
  }

  return descriptor;
}

// apply watch middleware for a property
function applyMiddleware(obj: any, property: string) {
  obj[VARIABLE] = obj[VARIABLE] || {};
  obj[VARIABLE][property] = [];

  const listeners: PropertyListener[] = obj[VARIABLE][property];
  const descriptor = getPropertyDescriptor(obj, property);

  let get: () => any;
  let set: (value: any) => void;

  if (descriptor.get || descriptor.set) {
    // save the getter as is
    get = descriptor.get;

    // wrap the setter (if exists)
    if (descriptor.set) {
      function notify() {
        const value: any = get.call(obj);
        for (const listener of listeners) {
          listener(value);
        }
      }

      set = function getter(value: any): void {
        descriptor.set.call(this, value);
        notify();
      };
    }
  } else {
    // init with the current value
    let value = descriptor.value;

    // function that call all listeners with the current value
    function notify() {
      for (const listener of listeners) {
        listener(value);
      }
    }

    // handle array observation
    function handleArrays(newValue: any): any {
      if (value instanceof Array) {
        unobserveArray(value, notify);
      }
      if (newValue instanceof Array) {
        observeArray(newValue, notify);
      }
      return newValue;
    }

    // initialize array (if exists)
    value = handleArrays(value);

    // create getter
    get = function getter(): any {
      return value;
    };

    // create setter with middleware
    set = function setter(update: any): void {
      if (update !== value) {
        value = handleArrays(update);
        notify();
      }
    };
  }

  // override property
  Object.defineProperty(obj, property, {
    enumerable: true,
    configurable: false,
    get,
    set
  });
}

/**
 * Property has changed callback
 */

export type PropertyListener = (value: any) => void;

/**
 * Returns true the object is observed, optionally the property may be specified
 */

export function isObservedObject(obj: any, property?: string): boolean {
  if (typeof obj === "object") {
    if (obj[VARIABLE]) {
      if (property) {
        return !!obj[VARIABLE][property];
      } else {
        return true;
      }
    }
  }
  return false;
}

/**
 * Start property observing
 */

export function observeProperty(obj: any, property: string, listener: PropertyListener): void {
  if (typeof obj !== "object") {
    throw new Error("Unexpected object to observe");
  }
  if (!isObservedObject(obj, property)) {
    applyMiddleware(obj, property);
  }
  obj[VARIABLE][property].push(listener);
}

/**
 * Stop property observing and remove the listener
 */

export function unobserveProperty(obj: any, property: string, listener: PropertyListener): void {
  if (isObservedObject(obj, property)) {
    const listeners: PropertyListener[] = obj[VARIABLE][property];
    const index: number = listeners.findIndex((l) => l === listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
