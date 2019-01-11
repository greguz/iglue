import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { Specification } from "../interfaces/Specification";

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
  binder: Binder,
  binding: Binding
): Directive {
  // argument required check
  if (binder.argumentRequired === true && !binding.argument) {
    throw new Error(`The binder ${binding.directive} requires an argument`);
  }

  // shortcut
  const el: HTMLElement = binding.el;

  // context object
  const context: any = {};

  // remove the binding argument
  el.removeAttribute(binding.attrName);

  // trigger bind hook
  if (binder.bind) {
    binder.bind.call(context, el, binding);
  }

  /**
   * Directive#refresh
   */

  function refresh(value: any): void {
    // apply value validation
    if (binder.value) {
      value = applySpecification(value, binding.attrValue, binder.value);
    }

    // execute binder routine
    if (binder.routine) {
      binder.routine.call(context, el, value, binding);
    }
  }

  /**
   * Directive#unbind
   */

  function unbind(): void {
    // trigger unbind hook
    if (binder.unbind) {
      binder.unbind.call(context, el, binding);
    }

    // restore original DOM attribute
    el.setAttribute(binding.attrName, binding.attrValue);
  }

  // return the configured directive
  return {
    refresh,
    unbind
  };
}
