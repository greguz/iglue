/**
 * Array methods that changes internally the array structure
 */

const ARR_METHODS: string[] = ["push", "pop", "shift", "unshift", "sort", "reverse", "splice"];

/**
 * Utility to listen array changes
 */

function subscribe(arr: any[], notify: () => void): () => void {
  // inject a middleware into all target methods
  for (const method of ARR_METHODS) {
    Object.defineProperty(arr, method, {
      enumerable: false,
      configurable: true,
      value: function middleware(...args: any[]) {
        const result = (Array as any).prototype[method].apply(this, args);
        notify();
        return result;
      }
    });
  }

  // return subscription function
  return function unsubscribe() {
    // restore the original methods (get from the array constructor)
    for (const method of ARR_METHODS) {
      Object.defineProperty(arr, method, {
        enumerable: false,
        configurable: true,
        value: (Array as any).prototype[method]
      });
    }
  };
}

/**
 * Check if an object is currently observed
 */

export function isObserved(obj: any, property?: string): boolean {
  if (typeof obj === "object") {
    if (obj.__listeners__) {
      if (property) {
        return !!obj.__listeners__[property];
      } else {
        return true;
      }
    }
  }
  return false;
}

/**
 * Default property descriptor (simple undefined value)
 */

const DEFAULT_DESCRIPTOR: PropertyDescriptor = {
  configurable: true,
  enumerable: true,
  writable: true,
  value: undefined
};

/**
 * Inject observing middleware into the object
 */

function applyMiddleware(obj: any, property: string) {
  obj.__listeners__ = obj.__listeners__ || {};
  obj.__listeners__[property] = [];

  function notify() {
    for (const listener of obj.__listeners__[property]) {
      listener();
    }
  }

  const descriptor = Object.getOwnPropertyDescriptor(obj, property)
    || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), property)
    || DEFAULT_DESCRIPTOR;

  let get: () => any;
  let set: (value: any) => void;

  if (descriptor.get || descriptor.set) {
    get = descriptor.get;

    if (descriptor.set) {
      set = function getter(value: any): void {
        descriptor.set.call(this, value);
        notify();
      };
    }
  } else {
    let subscription: () => void;

    function handleArrays(arr: any): any {
      if (subscription) {
        subscription();
        subscription = null;
      }
      if (arr instanceof Array) {
        subscription = subscribe(arr, notify);
      }
      return arr;
    }

    let value = handleArrays(descriptor.value);

    get = function getter(): any {
      return value;
    };

    set = function setter(update: any): void {
      if (update !== value) {
        value = handleArrays(update);
        notify();
      }
    };
  }

  Object.defineProperty(obj, property, {
    enumerable: !descriptor.get,
    configurable: false,
    get,
    set
  });
}

/**
 * Observe a object property
 */

export function observe(obj: any, property: string, listener: () => void): void {
  if (typeof obj !== "object") {
    throw new Error("Unexpected object to observe");
  }
  if (!isObserved(obj, property)) {
    applyMiddleware(obj, property);
  }
  obj.__listeners__[property].push(listener);
}

/**
 * Stop property observing
 */

export function unobserve(obj: any, property: string, listener: () => void): void {
  if (isObserved(obj, property)) {
    const listeners: any[] = obj.__listeners__[property];
    const index: number = listeners.findIndex((l) => l === listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
