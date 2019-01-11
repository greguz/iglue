import { Binder, BinderRoutine } from "./interfaces/Binder";
import { Component } from "./interfaces/Component";
import { Formatter, FormatterFunction } from "./interfaces/Formatter";
import { View, ViewOptions } from "./interfaces/View";

import $binders from "./binders";
import { buildView } from "./view";
import { assign, Collection } from "./utils";

/**
 * Public interfaces
 */

export * from "./interfaces/AttributeInfo";
export * from "./interfaces/Binder";
export * from "./interfaces/Binding";
export * from "./interfaces/Component";
export * from "./interfaces/Context";
export * from "./interfaces/Formatter";
export * from "./interfaces/Specification";
export * from "./interfaces/View";

/**
 * Public APIs
 */

export * from "./context";

/**
 * Global components
 */

export const components: Collection<Component> = {};

/**
 * Global binders
 */

export const binders: Collection<Binder | BinderRoutine> = $binders;

/**
 * Global formatters
 */

export const formatters: Collection<Formatter | FormatterFunction> = {
  args(method: any, ...boundArgs: any[]): (...args: any[]) => any {
    if (typeof method !== "function") {
      throw new Error("The target bound value is not a function");
    }
    return function(...args: any[]): any {
      return method.apply(this, boundArgs.concat(args));
    };
  },

  prop(obj: any, prop: string): any {
    if (typeof obj === "object" && obj !== null) {
      return obj[prop];
    }
  },

  eq(value: any, target: any): boolean {
    return value === target;
  },

  neq(value: any, target: any): boolean {
    return value !== target;
  },

  gt(value: any, target: any): boolean {
    return value > target;
  },

  gte(value: any, target: any): boolean {
    return value >= target;
  },

  lt(value: any, target: any): boolean {
    return value < target;
  },

  lte(value: any, target: any): boolean {
    return value <= target;
  }
};

/**
 * Bind a new view API
 */

export function bind(
  el: HTMLElement,
  data: object,
  options?: ViewOptions
): View {
  options = options || {};
  options.binders = assign({}, binders, options.binders);
  options.components = assign({}, components, options.components);
  options.formatters = assign({}, formatters, options.formatters);
  return buildView(el, data, options);
}
