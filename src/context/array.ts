// array methods that change the array
const METHODS: string[] = ["push", "pop", "shift", "unshift", "sort", "reverse", "splice"];

// array property where the callback listeners are saved
const VARIABLE = "_al_";

// observed array interface
interface ObservedArray extends Array<any> {
  [VARIABLE]: VoidFunction[];
}

// inject the watch middleware and set the listeners variable
function applyMiddleware(arr: any): void {
  // create the listeners array
  Object.defineProperty(arr, VARIABLE, {
    // not configurable, prevent double definition
    // not enumerable, prevent Object.assign cloning
    // not writable, prevent value assignation/override
    value: []
  });

  // wrap all array methods that changes the array structure
  for (const method of METHODS) {
    // override the default method
    Object.defineProperty(arr, method, {
      configurable: true,
      // not enumerable, prevent Object.assign cloning
      writable: true,
      value: function middleware(this: ObservedArray, ...args: any[]): any {
        // call the original method and get the result
        const result: any = (Array as any).prototype[method].apply(this, args);
        // trigger all listeners
        for (const listener of this[VARIABLE]) {
          listener();
        }
        // return the result
        return result;
      }
    });
  }
}

/**
 * Returns true if the argument is an array
 */

export function isArray(arr: any): boolean {
  return arr instanceof Array;
}

/**
 * Returns true when the array is observed
 */

export function isObservedArray(arr: any): boolean {
  if (isArray(arr)) {
    return !!arr[VARIABLE];
  } else {
    return false;
  }
}

/**
 * Observe the array
 */

export function observeArray(arr: any, listener: VoidFunction): void {
  if (!isArray(arr)) {
    throw new Error("Unexpected array to observe");
  }
  if (!isObservedArray(arr)) {
    applyMiddleware(arr);
  }
  arr[VARIABLE].push(listener);
}

/**
 * Remove the observe listener
 */

export function unobserveArray(arr: any, listener: VoidFunction): void {
  if (isObservedArray(arr)) {
    const listeners: VoidFunction[] = arr[VARIABLE];
    const index: number = listeners.findIndex(
      (fn: VoidFunction): boolean => fn === listener
    );
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
