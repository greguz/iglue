// variable where to inject the property listeners
const VARIABLE = "_ol_";

// observed object interface
interface ObservedObject extends Object {
  [VARIABLE]: {
    [prop: string]: VoidFunction[];
  };
}

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
  // ensure main listeners container object
  if (!obj[VARIABLE]) {
    Object.defineProperty(obj, VARIABLE, {
      // not configurable, prevent double definition
      // not enumerable, prevent Object.assign cloning
      // not writable, prevent value assignation/override
      value: {}
    });
  }

  // setup the single property listeners container
  obj[VARIABLE][property] = [];

  // get the original property descriptor
  const descriptor = getPropertyDescriptor(obj, property);

  // create the custom wrapped getter and setter
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
        // trigger all property listeners
        for (const listener of this[VARIABLE][property]) {
          listener();
        }
      };
    }
  } else {
    // init with the current value
    let value: any = descriptor.value;

    // create getter
    get = function getter(this: ObservedObject): any {
      return value;
    };

    // create setter with middleware
    set = function setter(this: ObservedObject, update: any): void {
      if (update !== value) {
        // update the current value
        value = update;
        // trigger all property listeners
        for (const listener of this[VARIABLE][property]) {
          listener();
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

export function observeProperty(obj: any, property: string, listener: VoidFunction): void {
  if (typeof obj !== "object" || obj === null) {
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

export function unobserveProperty(obj: any, property: string, listener: VoidFunction): void {
  if (isObservedObject(obj, property)) {
    const listeners: VoidFunction[] = obj[VARIABLE][property];
    const index: number = listeners.findIndex(
      (fn: VoidFunction): boolean => fn === listener
    );
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
