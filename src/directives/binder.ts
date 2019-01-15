import { Binder, BinderRoutine } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { Specification } from "../interfaces/Specification";

import { Collection, isObject, isFunction } from "../utils";

/**
 * Get and normalize a binder
 */
function getBinder(
  binders: Collection<Binder | BinderRoutine>,
  name: string
): Binder {
  const definition = binders[name];

  if (isFunction(definition)) {
    return { routine: definition };
  } else if (isObject(definition)) {
    return definition;
  } else {
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
 * Apply value specification utility
 */
function applySpecification(
  value: any,
  source: string,
  spec: Specification
): any {
  if (value === null || value === undefined) {
    if (spec.required === true) {
      throw new Error(`The required bound value "${source}" is not defined`);
    }
    if (spec.hasOwnProperty("default")) {
      value = spec.default;
    }
  } else {
    if (typeof spec.type === "string" && typeof value !== spec.type) {
      throw new Error(`The bound value "${source}" is not a "${spec.type}"`);
    }
    if (typeof spec.type === "function" && !(value instanceof spec.type)) {
      throw new Error(
        `The bound value "${source}" is not an instance of ${spec.type}`
      );
    }
    if (spec.validator) {
      const valid: boolean = spec.validator.call(null, value);
      if (!valid) {
        throw new Error(
          `The bound value "${value}" from "${source}" is not valid`
        );
      }
    }
  }

  return value;
}

/**
 * Build a binder directive
 */
export function buildBinderDirective(
  binders: Collection<Binder | BinderRoutine>,
  binding: Binding
): Directive {
  // Get the target binder
  const binder = getBinder(binders, binding.directive);

  // Required argument check
  if (binder.argumentRequired === true && !binding.argument) {
    throw new Error(`Binder ${binding.directive} requires an argument`);
  }

  // Target DOM element
  const el = binding.el;

  // Binder context
  const context: any = {};

  // Remove original attribute from DOM
  el.removeAttribute(binding.attrName);

  // Trigger first hook
  if (binder.bind) {
    binder.bind.call(context, el, binding);
  }

  /**
   * Directive#refresh
   */
  function refresh(value: any): void {
    // Apply value specification
    if (binder.value) {
      value = applySpecification(value, binding.attrValue, binder.value);
    }

    // Trigger second hook
    if (binder.routine) {
      binder.routine.call(context, el, value, binding);
    }
  }

  /**
   * Directive#unbind
   */
  function unbind(): void {
    // Trigger last hook
    if (binder.unbind) {
      binder.unbind.call(context, el, binding);
    }

    // Restore original DOM attribute
    el.setAttribute(binding.attrName, binding.attrValue);
  }

  // Return built directive
  return {
    refresh,
    unbind
  };
}
