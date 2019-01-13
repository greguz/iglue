import { Collection, isArray, isObject, parsePath, remove } from "../utils";

import { observeArray, unobserveArray } from "./array";
import { observeProperty, unobserveProperty } from "./property";

/**
 * Path change value callback
 */
export type PathNotifier = (newValue: any, oldValue: any) => void;

/**
 * Represents a single observed path
 */
interface Ticket {
  /**
   * Parsed path tokens
   */
  tokens: string[];
  /**
   * Registered "change" callback function
   */
  update: VoidFunction;
  /**
   * Registered notifiers
   */
  notifiers: PathNotifier[];
}

/**
 * Read current tickets storage
 */
function read(obj: any, property: string = "_ov_"): Collection<Ticket> {
  if (!isObject(obj)) {
    throw new Error("Argument is not an object");
  }
  if (!obj.hasOwnProperty(property)) {
    Object.defineProperty(obj, property, { value: {} });
  }
  return obj[property];
}

/**
 * Get the current values chain
 */
function realize(obj: any, tokens: string[]): any[] {
  const values: any[] = [];
  for (const token of tokens) {
    values.push(obj);
    if (isObject(obj)) {
      obj = obj[token];
    } else {
      obj = undefined;
    }
  }
  values.push(obj);
  return values;
}

/**
 * Handle single path value logic
 */
function register(
  onProperty: (obj: any, property: string, callback: VoidFunction) => void,
  onArray: (arr: any, callback: VoidFunction) => void,
  value: any,
  token: string | undefined,
  callback: VoidFunction
): void {
  if (token === undefined) {
    if (isArray(value)) {
      onArray(value, callback);
    }
  } else if (isObject(value)) {
    if (isArray(value) && (/^\d+$/.test(token) || token === "length")) {
      onArray(value, callback);
    } else {
      onProperty(value, token, callback);
    }
  }
}

/**
 * Util
 */
function observe(
  value: any,
  token: string | undefined,
  callback: VoidFunction
): void {
  register(observeProperty, observeArray, value, token, callback);
}

/**
 * Util
 */
function unobserve(
  value: any,
  token: string | undefined,
  callback: VoidFunction
): void {
  register(unobserveProperty, unobserveArray, value, token, callback);
}

/**
 * Build the path update callback
 */
function getUpdateFunction(
  obj: any,
  tokens: string[],
  notifiers: PathNotifier[]
) {
  // Chain values from the past execution
  let oldValues: any[] = realize(obj, tokens);

  return function update(): void {
    // Get current chain values
    const newValues = realize(obj, tokens);

    // Sync the observing path
    for (let i = 0; i <= tokens.length; i++) {
      const token = tokens[i];
      const oldValue = oldValues[i];
      const newValue = newValues[i];

      if (oldValue !== newValue) {
        unobserve(oldValue, token, update);
        observe(newValue, token, update);
      }
    }

    // Trigger notifiers
    const oldLastValue = oldValues[tokens.length];
    const newLastValue = newValues[tokens.length];
    for (const notifier of notifiers) {
      notifier(newLastValue, oldLastValue);
    }

    // Update current values
    oldValues = newValues;
  };
}

/**
 * Observe path value
 */
export function observePath(
  obj: any,
  path: string,
  notifier: PathNotifier
): void {
  // Read tickets storage
  const tickets = read(obj);

  // Retrieve path ticket
  const ticket = tickets[path];

  if (ticket) {
    // Just append the new notifier
    ticket.notifiers.push(notifier);
  } else {
    // Build tokens from path
    const tokens = parsePath(path);

    // Create notifiers array
    const notifiers = [notifier];

    // Build the update callback
    const update = getUpdateFunction(obj, tokens, notifiers);

    // Start data observing
    const values = realize(obj, tokens);
    for (let i = 0; i <= tokens.length; i++) {
      observe(values[i], tokens[i], update);
    }

    // Save the new ticket
    tickets[path] = {
      tokens,
      update,
      notifiers
    };
  }
}

/**
 * Unobserve path value, returns true if the notifier is removed
 */
export function unobservePath(
  obj: any,
  path: string,
  notifier: PathNotifier
): boolean {
  // Read tickets storage
  const tickets = read(obj);

  // Retrieve path ticket
  const ticket = tickets[path];

  if (ticket) {
    // Extract ticket info
    const { notifiers, tokens, update } = ticket;

    // Remove target notifier
    const removed = remove(notifiers, notifier);

    // Remove custom middleware if necessary
    if (notifiers.length === 0) {
      // Stop data observing
      const values = realize(obj, tokens);
      for (let i = 0; i <= tokens.length; i++) {
        unobserve(values[i], tokens[i], update);
      }

      // Destroy the ticket
      tickets[path] = undefined;
    }

    // Return removal result
    return removed;
  }

  // Fallback
  return false;
}

/**
 * Returns true if the path is observed
 */
export function isPathObserved(obj: any, path: string): boolean {
  return !!read(obj)[path];
}
