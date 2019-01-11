import { isObject, remove } from "../utils";

/**
 * This is the variable the all data about observing is placed
 */

const STORE = "_op_";

/**
 * Represents an observed object
 */

interface ObservedObject {
  [STORE]: {
    [property: string]: PropertyInfo;
  };
}

/**
 * Single observed property information
 */

interface PropertyInfo {
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

function getPropertyDescriptor(
  obj: object,
  property: string
): PropertyDescriptor {
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

  // ensure always configurable descriptor
  if (descriptor.configurable !== true) {
    descriptor.configurable = true;
  }

  return descriptor;
}

/**
 * Apply observe middleware to the object
 */

function applyMiddleware(
  obj: ObservedObject,
  property: string,
  notifier: PropertyNotifier
): void {
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
  const notifiers: PropertyNotifier[] = [notifier];

  // custom wrapped getter and setter
  let get: () => any;
  let set: (value: any) => void;

  if (descriptor.get || descriptor.set) {
    // save the getter as is
    get = descriptor.get;

    // wrap the setter
    if (descriptor.set) {
      set = function setter(this: ObservedObject, update: any): void {
        // call the original setter to update the value
        descriptor.set.call(this, update);

        // get the current value
        const value: any = descriptor.get.call(this);

        // trigger all property notifiers
        for (const n of notifiers) {
          n(value);
        }
      };
    }
  } else {
    // create getter
    get = function getter(this: ObservedObject): any {
      return descriptor.value;
    };

    // create setter with middleware
    set = function setter(this: ObservedObject, value: any): void {
      if (descriptor.value !== value) {
        // update the current value
        descriptor.value = value;

        // trigger all property notifiers
        for (const n of notifiers) {
          n(value);
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

  // save the property descriptor and setup notifiers array
  obj[STORE][property] = {
    d: descriptor,
    n: notifiers
  };
}

/**
 * Remove observe middleware and restore the origianl property status
 */

function removeMiddleware(obj: ObservedObject, property: string): void {
  // restore the original property descriptor
  Object.defineProperty(obj, property, obj[STORE][property].d);

  // remove property info from the store
  obj[STORE][property] = undefined;
}

/**
 * Returns true the object is observed, optionally the property may be specified
 */

export function isObservedObject(obj: any, property?: string): boolean {
  if (isObject(obj) && obj.hasOwnProperty(STORE)) {
    if (property === undefined || property === null) {
      return true;
    } else {
      return !!obj[STORE][property];
    }
  }
  return false;
}

/**
 * Start property observing
 */

export function observeProperty(
  obj: any,
  property: string,
  notifier: PropertyNotifier
): void {
  // input validation
  if (!isObject(obj)) {
    throw new Error("Unexpected object to observe");
  }

  // register the new notifier
  if (isObservedObject(obj, property)) {
    obj[STORE][property].n.push(notifier);
  } else {
    applyMiddleware(obj, property, notifier);
  }
}

/**
 * Stop property observing, returns true is the notifier is removed
 */

export function unobserveProperty(
  obj: any,
  property: string,
  notifier: PropertyNotifier
): boolean {
  if (isObservedObject(obj, property)) {
    const notifiers: PropertyNotifier[] = obj[STORE][property].n;
    const removed: boolean = remove(notifiers, notifier);
    if (notifiers.length === 0) {
      removeMiddleware(obj, property);
    }
    return removed;
  }
  return false;
}
