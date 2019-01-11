import { Binder, BinderRoutine } from "./interfaces/Binder";
import { Component } from "./interfaces/Component";

import { isObject, isFunction } from "./utils";

/**
 * Map a binder definition to a full binder object
 */

export function mapBinder(
  definition: Binder | BinderRoutine,
  name: string
): Binder {
  if (isObject(definition)) {
    // full configured binder
    return definition as Binder;
  } else if (isFunction(definition)) {
    // simple binder, just the routine function
    return { routine: definition as BinderRoutine };
  } else {
    // fallback to default binder, bind the element attribute
    return {
      routine(el: HTMLElement, value: any): void {
        if (value === undefined || value === null) {
          el.removeAttribute(name);
        } else {
          el.setAttribute(name, value.toString());
        }
      }
    };
  }
}

/**
 * Component existence check
 */

export function mapComponent(definition: Component, name: string): Component {
  if (isObject(definition)) {
    return definition;
  } else {
    throw new Error(`Unable to find component "${name}"`);
  }
}
