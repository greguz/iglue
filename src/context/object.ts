import { findIndex } from "../utils";

/**
 * This is the variable the all data about observing is placed
 */

const STORE = "_op_"; // "op" stands for "observed properties"

/**
 * Represents an observed object
 */

interface IObservedObject {
  [STORE]: {
    [property: string]: IPropertyInfo;
  };
}

/**
 * Single observed property information
 */

interface IPropertyInfo {
  // original property descriptor
  d: PropertyDescriptor;
  // registered property notifiers
  n: PropertyNotifier[];
}

/**
 * Notifier function to call on value change
 */

export type PropertyNotifier = (value: any) => void;

/**
 * Get the property descriptor (walk through prototype)
 */

function getPropertyDescriptor(obj: object, property: string): PropertyDescriptor {
  let descriptor: PropertyDescriptor;

  // each all prototype chain
  while (obj && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(obj, property);
    obj = Object.getPrototypeOf(obj);
  }

  // fallback to undefined value descriptor
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

/**
 * Apply observe middleware to the object
 */

function applyMiddleware(obj: IObservedObject, property: string): void {
  // ensure object data store
  if (!obj.hasOwnProperty(STORE)) {
    Object.defineProperty(obj, STORE, {
      // not configurable, prevent double definition
      // not enumerable, prevent Object.assign cloning
      // not writable, prevent value assignation/override
      value: {}
    });
  }

  // get the original property descriptor
  const descriptor = getPropertyDescriptor(obj, property);

  // registered notifiers
  const notifiers: PropertyNotifier[] = [];

  // save the property descriptor and setup notifiers array
  obj[STORE][property] = {
    d: descriptor,
    n: notifiers
  };

  // custom wrapped getter and setter
  let get: () => any;
  let set: (value: any) => void;

  if (descriptor.get || descriptor.set) {
    // save the getter as is
    get = descriptor.get;

    // wrap the setter
    if (descriptor.set) {
      set = function setter(this: IObservedObject, update: any): void {
        // call the original setter to update the value
        descriptor.set.call(this, update);

        // get the current value
        const value: any = descriptor.get.call(this);

        // trigger all property notifiers
        for (const notifier of notifiers) {
          notifier(value);
        }
      };
    }
  } else {
    // init with the current value
    let value: any = descriptor.value;

    // create getter
    get = function getter(this: IObservedObject): any {
      return value;
    };

    // create setter with middleware
    set = function setter(this: IObservedObject, update: any): void {
      if (update !== value) {
        // update the current value
        value = update;

        // trigger all property notifiers
        for (const notifier of notifiers) {
          notifier(value);
        }
      }
    };
  }

  // override property
  Object.defineProperty(obj, property, {
    enumerable: true,
    configurable: true,
    get,
    set
  });
}

/**
 * Remove observe middleware and restore the origianl property status
 */

function removeMiddleware(obj: IObservedObject, property: string): void {
  // get the property info
  const info: IPropertyInfo = obj[STORE][property];

  // get the original property descriptor
  const descriptor: PropertyDescriptor = info.d;

  // restore the original property descriptor
  Object.defineProperty(obj, property, descriptor);

  // remove property info from the store
  obj[STORE][property] = undefined;
}

/**
 * Returns true the object is observed, optionally the property may be specified
 */

export function isObservedObject(obj: any, property?: string): boolean {
  if (typeof obj === "object" && obj !== null) {
    if (obj.hasOwnProperty(STORE)) {
      if (property == null) {
        return true;
      } else {
        return !!obj[STORE][property];
      }
    }
  }
  return false;
}

/**
 * Start property observing
 */

export function observeProperty(obj: any, property: string, notifier: PropertyNotifier): void {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Unexpected object to observe");
  }
  if (!isObservedObject(obj, property)) {
    applyMiddleware(obj, property);
  }
  obj[STORE][property].n.push(notifier);
}

/**
 * Stop property observing, returns true is the notifier is removed
 */

export function unobserveProperty(obj: any, property: string, notifier: PropertyNotifier): boolean {
  if (isObservedObject(obj, property)) {
    // get the registered notifier functions
    const notifiers: PropertyNotifier[] = obj[STORE][property].n;

    // get the index of the argument notifier
    const index: number = findIndex(
      notifiers,
      (entry: PropertyNotifier): boolean => entry === notifier
    );

    // remove if necessary
    if (index >= 0) {
      notifiers.splice(index, 1);
    }

    // remove middleware is no notifiers registered
    if (notifiers.length === 0) {
      removeMiddleware(obj, property);
    }

    // return true if we removed the notifier
    return index >= 0;
  }
  return false;
}
