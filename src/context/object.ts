import { isArray, observeArray, unobserveArray } from "./array";

// variable where to inject the property listeners
const VARIABLE = "_ol_";

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
  // lock and hide the listeners container
  if (!obj[VARIABLE]) {
    Object.defineProperty(obj, VARIABLE, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: {}
    });
  }

  const listeners: PropertyListener[] = obj[VARIABLE][property] = [];
  const descriptor = getPropertyDescriptor(obj, property);

  // current property value
  let value: any;

  // notification callback
  function notify() {
    for (const listener of listeners) {
      listener(value);
    }
  }

  // handle array observation
  function handleArrays(update: any): any {
    if (isArray(value)) {
      unobserveArray(value, notify);
    }
    if (isArray(update)) {
      observeArray(update, notify);
    }
    return update;
  }

  // create the custom wrapped getter and setter
  let get: () => any;
  let set: (value: any) => void;

  if (descriptor.get || descriptor.set) {
    // save the getter as is
    get = descriptor.get;

    // wrap the setter
    if (descriptor.set) {
      set = function getter(update: any): void {
        descriptor.set.call(this, update);
        value = descriptor.get.call(this);
        notify();
      };
    }
  } else {
    // init with the current value
    value = handleArrays(descriptor.value);

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
  if (typeof obj === "object" && obj !== null) {
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
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Unexpected object to observe");
  }
  if (property === "length" && isArray(obj)) {
    observeArray(obj, listener);
  } else {
    if (!isObservedObject(obj, property)) {
      applyMiddleware(obj, property);
    }
    obj[VARIABLE][property].push(listener);
  }
}

/**
 * Stop property observing and remove the listener
 */

export function unobserveProperty(obj: any, property: string, listener: PropertyListener): void {
  if (property === "length" && isArray(obj)) {
    unobserveArray(obj, listener);
  } else if (isObservedObject(obj, property)) {
    const listeners: PropertyListener[] = obj[VARIABLE][property];
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
  }
}
