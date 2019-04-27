import { Formatter, FormatterFunction } from "./interfaces/Formatter";

import { isFunction, isObject } from "./utils/language";
import { Collection } from "./utils/type";

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
