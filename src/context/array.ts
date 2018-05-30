// array mathods that change the array
const METHODS: string[] = ["push", "pop", "shift", "unshift", "sort", "reverse", "splice"];

// variable name to inject into tha array
const VARIABLE: string = "_al_";

// inject the watch middleware and set the listeners variable
function applyMiddleware(arr: any): void {
  // lock and hide the listeners container
  Object.defineProperty(arr, VARIABLE, {
    value: []
  });

  const listeners: VoidFunction[] = arr[VARIABLE];

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  for (const method of METHODS) {
    Object.defineProperty(arr, method, {
      configurable: true,
      writable: true,
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
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
  }
}
