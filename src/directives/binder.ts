import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { Specification } from "../interfaces/Specification";

import { isFunction, isString } from "../utils";

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
    if (isString(spec.type) && typeof value !== spec.type) {
      throw new Error(`The bound value "${source}" is not a "${spec.type}"`);
    }
    if (isFunction(spec.type) && !(value instanceof spec.type)) {
      throw new Error(
        `The bound value "${source}" is not an instance of ${spec.type}`
      );
    }
    if (spec.validator) {
      const valid = spec.validator.call(null, value);
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
export function getBinderDirective(
  el: HTMLElement,
  binder: Binder,
  binding: Binding
): Directive {
  // Required argument check
  if (binder.argumentRequired === true && !binding.argument) {
    throw new Error(`Binder ${binding.directive} requires an argument`);
  }

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
