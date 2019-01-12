import { Collection, isObject, remove } from "../utils";

/**
 * Notifier function to call on value change
 */
export type PropertyNotifier = (value: any) => void;

/**
 * Single observed property information
 */
interface PropertyTicket {
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
function getStore(obj: any, property = "_op_"): Collection<PropertyTicket> {
  if (!isObject(obj)) {
    throw new Error("Argument is not a object");
  }
  if (!obj.hasOwnProperty(property)) {
    Object.defineProperty(obj, property, { value: {} });
  }
  return obj[property];
}

/**
 * Get the property descriptor (deep version)
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
 * TODO: docs
 */
function getStaticGetter(descriptor: PropertyDescriptor) {
  return function staticGetter() {
    return descriptor.value;
  };
}

/**
 * TODO: docs
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
 * TODO: docs
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
 * Start property observing
 */
export function observeProperty(
  obj: any,
  property: string,
  notifier: PropertyNotifier
): void {
  // Read storage property
  const store = getStore(obj);

  // Read current property ticket
  const ticket = store[property];

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
    store[property] = {
      descriptor,
      notifiers
    };
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
  // Read tickets storage
  const store = getStore(obj);

  // Read property ticket
  const info = store[property];
  if (info) {
    const { descriptor, notifiers } = info;

    // Try to remove the notifier
    const removed = remove(notifiers, notifier);

    // When there's no notifiers remove the custom middleware
    if (notifiers.length === 0) {
      // Restore the original property descriptor
      Object.defineProperty(obj, property, descriptor);

      // Remove property ticket
      store[property] = undefined;
    }

    // Return the removed status
    return removed;
  }

  // Fallback
  return false;
}

/**
 * Returns true the object is observed, optionally the property may be specified
 */
export function isPropertyObserved(obj: any, property: string): boolean {
  return !!getStore(obj)[property];
}
