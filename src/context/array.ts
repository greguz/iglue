import { isArray, remove } from "../utils";

/**
 * Notifier function to call on array change
 */
export type ArrayNotifier = () => void;

/**
 * Array methods to patch
 */
const METHODS = [
  "push",
  "pop",
  "shift",
  "unshift",
  "sort",
  "reverse",
  "splice"
];

/**
 * Read current array notifiers
 */
function read(arr: any, property: string = "_oa_"): ArrayNotifier[] {
  if (!isArray(arr)) {
    throw new Error("Argument is not an array");
  }
  if (!arr.hasOwnProperty(property)) {
    Object.defineProperty(arr, property, { value: [] });
  }
  return arr[property];
}

/**
 * Apply notifiers triggering to a function
 */
function wrap(fn: (...args: any[]) => any, notifiers: ArrayNotifier[]) {
  return function wrapped(...args: any[]): any {
    // call the original method and get the result
    const result = fn.apply(this, args);

    // trigger all notifiers
    for (const notifier of notifiers) {
      notifier();
    }

    // return the result
    return result;
  };
}

/**
 * Observe array changes
 */
export function observeArray(arr: any, notifier: ArrayNotifier): void {
  // Read current notifiers
  const notifiers = read(arr);

  // Apply custom middleware if necessary
  if (notifiers.length === 0) {
    for (const method of METHODS) {
      Object.defineProperty(arr, method, {
        configurable: true,
        value: wrap((Array.prototype as any)[method], notifiers)
      });
    }
  }

  // Save the target notifier
  notifiers.push(notifier);
}

/**
 * Remove the observe notifier, returns true when the notifier is removed
 */
export function unobserveArray(arr: any, notifier: ArrayNotifier): boolean {
  // Read current notifiers
  const notifiers = read(arr);

  // Try to remove the target notifier
  const removed = remove(notifiers, notifier);

  // Remove custom middleware if necessary
  if (notifiers.length === 0) {
    for (const method of METHODS) {
      Object.defineProperty(arr, method, {
        configurable: true,
        value: (Array.prototype as any)[method]
      });
    }
  }

  // Return removal result
  return removed;
}

/**
 * Returns true when the argument is an observed array
 */
export function isArrayObserved(arr: any): boolean {
  return read(arr).length > 0;
}
