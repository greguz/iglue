import { Collection, isObject, remove } from "../utils";

/**
 * Property value change callback
 */
export type PropertyNotifier = (value: any) => void;

/**
 * Represents a single observed property
 */
interface Ticket {
  /**
   * Original property descriptor
   */
  descriptor: PropertyDescriptor;
  /**
   * Registered notifiers
   */
  notifiers: PropertyNotifier[];
}

/**
 * Read tickets storage
 */
function read(obj: any, property = "_op_"): Collection<Ticket> {
  if (!isObject(obj)) {
    throw new Error("Argument is not an object");
  }
  if (!obj.hasOwnProperty(property)) {
    Object.defineProperty(obj, property, { value: {} });
  }
  return obj[property];
}

/**
 * Get the property descriptor (deep/proto version)
 */
function getPropertyDescriptor(obj: any, property: string): PropertyDescriptor {
  let descriptor: PropertyDescriptor | undefined;

  while (obj && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(obj, property);
    obj = Object.getPrototypeOf(obj);
  }

  return descriptor
    ? {
        ...descriptor,
        configurable: true
      }
    : {
        configurable: true,
        enumerable: true,
        writable: true
      };
}

/**
 * Wrap the descriptor value into a function
 */
function getStaticGetter(descriptor: PropertyDescriptor) {
  return function staticGetter() {
    return descriptor.value;
  };
}

/**
 * Update the descriptor value and fire the notifiers
 */
function getStaticSetter(
  descriptor: PropertyDescriptor,
  notifiers: PropertyNotifier[]
) {
  return function staticSetter(value: any): void {
    if (descriptor.value !== value) {
      descriptor.value = value;

      for (const notifier of notifiers) {
        notifier(value);
      }
    }
  };
}

/**
 * Fire the custom setter, read from getter the updated value and trigger notifiers
 */
function getDynamicSetter(
  get: () => any,
  set: (value: any) => void,
  notifiers: PropertyNotifier[]
) {
  return function dynamicSetter(value: any): void {
    set.call(this, value);

    value = get.call(this);

    for (const notifier of notifiers) {
      notifier(value);
    }
  };
}

/**
 * Observe object property
 */
export function observeProperty(
  obj: any,
  property: string,
  notifier: PropertyNotifier
): void {
  // Read storage property
  const tickets = read(obj);

  // Read current property ticket
  const ticket = tickets[property];

  if (ticket) {
    // Ticket in place, push new notifier
    ticket.notifiers.push(notifier);
  } else {
    // Get the property descriptor
    const descriptor = getPropertyDescriptor(obj, property);

    // Build notifiers array
    const notifiers = [notifier];

    // Build custom getter
    const get = descriptor.get || getStaticGetter(descriptor);

    // Build custom setter
    const set = descriptor.set
      ? getDynamicSetter(get, descriptor.set, notifiers)
      : getStaticSetter(descriptor, notifiers);

    // Inject middleware
    Object.defineProperty(obj, property, {
      enumerable: true,
      configurable: true,
      get,
      set
    });

    // Save ticket
    tickets[property] = {
      descriptor,
      notifiers
    };
  }
}

/**
 * Unobserve object property, returns true if the notifier is removed
 */
export function unobserveProperty(
  obj: any,
  property: string,
  notifier: PropertyNotifier
): boolean {
  // Read tickets storage
  const tickets = read(obj);

  // Read property ticket
  const info = tickets[property];
  if (info) {
    const { descriptor, notifiers } = info;

    // Try to remove the notifier
    const removed = remove(notifiers, notifier);

    // When there's no notifiers remove the custom middleware
    if (notifiers.length === 0) {
      // Restore the original property descriptor
      Object.defineProperty(obj, property, descriptor);

      // Remove property ticket
      tickets[property] = undefined;
    }

    // Return the removed status
    return removed;
  }

  // Fallback
  return false;
}

/**
 * Returns true if the property is observed
 */
export function isPropertyObserved(obj: any, property: string): boolean {
  return !!read(obj)[property];
}
