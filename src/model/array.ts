// array mathods that change the array
const METHODS: string[] = ["push", "pop", "shift", "unshift", "sort", "reverse", "splice"];

// variable name to inject into tha array
const VARIABLE: string = "_al_";

// inject the watch middleware and set the listeners variable
function applyMiddleware(arr: any): void {
  // lock and hide the listeners container
  Object.defineProperty(arr, VARIABLE, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: []
  });

  const listeners: ArrayListener[] = arr[VARIABLE];

  function notify() {
    for (const listener of listeners) {
      listener(arr);
    }
  }

  for (const method of METHODS) {
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
}

/**
 * Returns true if the argument is an array
 */

export function isArray(arr: any): boolean {
  return arr instanceof Array;
}

/**
 * Array is changed callback
 */

export type ArrayListener = (arr: any[]) => void;

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

export function observeArray(arr: any, listener: ArrayListener): void {
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

export function unobserveArray(arr: any, listener: ArrayListener): void {
  if (isObservedArray(arr)) {
    const listeners: ArrayListener[] = arr[VARIABLE];
    const index: number = listeners.findIndex((l) => l === listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }
}
