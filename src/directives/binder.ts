import { Application } from "../interfaces/Application";
import { Attribute } from "../interfaces/Attribute";
import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";
import { Directive } from "../interfaces/Directive";
import { Specification } from "../interfaces/Specification";

import { buildExpressionGetter, buildExpressionSetter } from "../libs/engine";

import {
  assign,
  isArray,
  isFunction,
  isNil,
  isObject
} from "../utils/language";

function isInstanceOf(value: any, Type: Function) {
  return typeof value === "object"
    ? value instanceof Type
    : Object.getPrototypeOf(value) === Type.prototype;
}

/**
 * Apply value specification utility
 */
function applySpec(value: any, spec: Specification): any {
  if (isNil(value)) {
    if (spec.required === true) {
      throw new Error(`Value "${value}" does not meet the requirements`);
    }
    if (spec.hasOwnProperty("default")) {
      value = spec.default;
    }
  } else {
    if (spec.type) {
      const types = isArray(spec.type) ? spec.type : [spec.type];
      for (const Type of types) {
        if (!isInstanceOf(value, Type)) {
          throw new Error(`Value "${value}" does not meet the requirements`);
        }
      }
    }
    if (spec.validator) {
      const valid = spec.validator.call(null, value);
      if (!valid) {
        throw new Error(`Value "${value}" does not meet the requirements`);
      }
    }
  }

  return value;
}

/**
 * Get and normalize a binder
 */
function getBinderByName(app: Application, name: string): Binder {
  const definition = app.binders[name];

  if (isFunction(definition)) {
    return { routine: definition };
  } else if (isObject(definition)) {
    return definition;
  } else {
    return {
      routine(el: HTMLElement, value: any): void {
        if (isNil(value)) {
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
function buildBinding(app: Application, attribute: Attribute): Binding {
  const { context, formatters } = app;
  const { expression } = attribute;

  return assign({}, attribute, {
    context,
    get: buildExpressionGetter(expression, formatters).bind(context),
    set: buildExpressionSetter(expression, formatters).bind(context)
  });
}

/**
 * Build a binder directive
 */
export function buildBinderDirective(
  app: Application,
  el: HTMLElement,
  attribute: Attribute
): Directive {
  const binder = getBinderByName(app, attribute.directive);
  if (binder.argumentRequired === true && !attribute.argument) {
    throw new Error(`Binder ${attribute.directive} requires an argument`);
  }

  const binding = buildBinding(app, attribute);
  const context: any = {};
  const { expression } = attribute;

  if (binder.bind) {
    binder.bind.call(context, el, binding);
  }
  el.removeAttribute(attribute.name);

  function update(value: any) {
    if (binder.value) {
      value = applySpec(value, binder.value);
    }
    if (binder.routine) {
      binder.routine.call(context, el, value, binding);
    }
  }

  function unbind() {
    if (binder.unbind) {
      binder.unbind.call(context, el, binding);
    }
    el.setAttribute(attribute.name, attribute.value);
  }

  return {
    expression,
    update,
    unbind
  };
}
