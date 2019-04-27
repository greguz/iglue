import { Component } from "./interfaces/Component";
import { Formatter, FormatterFunction } from "./interfaces/Formatter";
import { View, ViewOptions } from "./interfaces/View";

import binders from "./binders";
import { buildView } from "./view";

import { isFunction, isObject } from "./utils/language";
import { Collection } from "./utils/type";

export * from "./interfaces/Binder";
export * from "./interfaces/Binding";
export * from "./interfaces/Component";
export * from "./interfaces/Context";
export * from "./interfaces/Formatter";
export * from "./interfaces/Specification";
export * from "./interfaces/View";

export * from "./context";

export * from "./utils/type";

export { binders };

export const components: Collection<Component> = {};

export const formatters: Collection<Formatter | FormatterFunction> = {
  args(method: any, ...boundArgs: any[]): (...args: any[]) => any {
    if (!isFunction(method)) {
      throw new Error("The target bound value is not a function");
    }
    return function(...args: any[]): any {
      return method.apply(this, boundArgs.concat(args));
    };
  },

  prop(obj: any, prop: string): any {
    return isObject(obj) ? obj[prop] : undefined;
  },

  eq(value: any, target: any) {
    return value === target;
  },

  neq(value: any, target: any) {
    return value !== target;
  },

  gt(value: any, target: any) {
    return value > target;
  },

  gte(value: any, target: any) {
    return value >= target;
  },

  lt(value: any, target: any) {
    return value < target;
  },

  lte(value: any, target: any) {
    return value <= target;
  }
};

export function bind(
  el: HTMLElement,
  obj: object = {},
  options: ViewOptions = {}
): View {
  return buildView(
    el,
    obj,
    { ...binders, ...options.binders },
    { ...components, ...options.components },
    { ...formatters, ...options.formatters }
  );
}
