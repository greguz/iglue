import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
import { Formatter, IFormatter } from "./interfaces/IFormatter";
import { IView, IViewOptions } from "./interfaces/IView";

import { buildView } from "./buildView";

import { assign } from "./utils";

import $binders from "./binders";

/**
 * Public interfaces
 */

export * from "./interfaces/IBinder";
export * from "./interfaces/IBinding";
export * from "./interfaces/ICollection";
export * from "./interfaces/IComponent";
export * from "./interfaces/IView";

/**
 * Global binders
 */

export const binders: ICollection<IBinder | IBinderRoutine> = $binders;

/**
 * Global components
 */

export const components: ICollection<IComponent> = {};

/**
 * Global formatters
 */

export const formatters: ICollection<Formatter | IFormatter> = {

  args(method: any, ...boundArgs: any[]): (...args: any[]) => any {
    if (typeof method !== "function") {
      throw new Error("The target bound value is not a function");
    }
    return function boundMethod(...args: any[]): any {
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
 * Bind a new view
 */

export function bind(el: HTMLElement, data: object, options?: IViewOptions): IView {
  options = options || {};
  options.binders = assign({}, binders, options.binders);
  options.components = assign({}, components, options.components);
  options.formatters = assign({}, formatters, options.formatters);
  const view = buildView(el, data, options);
  view.bind();
  return view;
}
