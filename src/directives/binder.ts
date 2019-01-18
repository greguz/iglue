import { App } from "../interfaces/App";
import { AttributeInfo } from "../interfaces/AttributeInfo";
import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { Specification } from "../interfaces/Specification";

import { parseAttribute } from "../parse/attribute";
import { getExpressionGetter, getExpressionSetter } from "../parse/expression";

import { isFunction, isObject, isString } from "../utils";

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
 * Get and normalize a binder
 */
function getBinderByName(this: App, name: string): Binder {
  const definition = this.binders[name];

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
 * Build binding object
 */
function buildBinding(this: App, info: AttributeInfo): Binding {
  const { context, formatters } = this;

  const get = getExpressionGetter(formatters, info).bind(context);
  const set = getExpressionSetter(formatters, info).bind(context);

  return {
    ...info,
    context,
    get,
    set
  };
}

/**
 * Build a binder directive
 */
export function buildBinderDirective(
  this: App,
  el: HTMLElement,
  attrName: string
): Directive {
  // Parse target attribute info
  const info = parseAttribute(this.prefix, el, attrName);

  // Build binding object
  const binding: Binding = buildBinding.call(this, info);

  // Retrieve target binder (custom directive)
  const binder: Binder = getBinderByName.call(this, info.directive);

  // Enforce directive argument
  if (binder.argumentRequired === true && !info.argument) {
    throw new Error(`Binder ${info.directive} requires an argument`);
  }

  // Create binder context
  const context = {} as any;

  // Trigger first hook
  if (binder.bind) {
    binder.bind.call(context, el, binding);
  }

  // Remove original attribute from DOM
  el.removeAttribute(attrName);

  // Return built directive
  return {
    ...info,
    update(this: App, value: any) {
      // Apply custom value validation
      if (binder.value) {
        value = applySpecification(value, info.attrValue, binder.value);
      }
      // Trigger routine hook
      if (binder.routine) {
        binder.routine.call(context, el, value, binding);
      }
    },
    unbind(this: App) {
      // Trigger routine hook
      if (binder.unbind) {
        binder.unbind.call(context, el, binding);
      }
      // Restore original attribute
      el.setAttribute(attrName, info.attrValue);
    }
  };
}
