import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
import { Formatter, IFormatter } from "./interfaces/IFormatter";
import { IView, IViewOptions } from "./interfaces/IView";

import { buildView } from "./buildView";

import { assign } from './utils';

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

export const binders: ICollection<IBinder | IBinderRoutine> = {

  disabled(el: HTMLFormElement, value: any): void {
    el.disabled = !!value;
  },

  enabled(el: HTMLFormElement, value: any): void {
    el.disabled = !value;
  },

  hide(el: HTMLElement, value: any): void {
    el.style.display = value ? "none" : "";
  },

  show(el: HTMLElement, value: any): void {
    el.style.display = value ? "" : "none";
  },

  html(el: HTMLElement, value: any): void {
    el.innerHTML = value == null ? "" : value;
  },

  text(el: HTMLElement, value: any): void {
    if (el.textContent) {
      el.textContent = value == null ? "" : value;
    } else {
      el.innerText = value == null ? "" : value;
    }
  },

  on: {
    argumentRequired: true,
    bind(el: HTMLElement, binding: IBinding): void {
      const self = this;
      this.listener = function (...args: any[]): void {
        if (typeof self.handler === "function") {
          args.push(this);
          self.handler.apply(binding.context, args);
        } else {
          throw new Error(`The target value bound with "${binding.attrValue}" is not a valid handler for event "${binding.argument}"`);
        }
      };
      el.addEventListener(binding.argument, this.listener, false);
    },
    routine(el: HTMLElement, handler: any): void {
      this.handler = handler;
    },
    unbind(el: HTMLElement, binding: IBinding): void {
      el.removeEventListener(binding.argument, this.listener, false);
    }
  },

  class(el: HTMLElement, value: any, binding: IBinding): void {
    if (binding.argument) {
      if (!value) {
        el.classList.remove(binding.argument);
      } else {
        el.classList.add(binding.argument);
      }
    } else {
      el.className = value;
    }
  },

  value: {
    bind(el: HTMLFormElement, binding: IBinding): void {
      this.handler = () => {
        if (el.type === "checkbox") {
          binding.set(el.checked);
        } else {
          binding.set(el.value);
        }
      };
      this.event = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
      binding.el.addEventListener(this.event, this.handler, false);
    },
    routine(el: HTMLFormElement, value: any): void {
      if (el.type === "checkbox") {
        el.checked = !!value;
      } else {
        el.value = value == null ? "" : value;
      }
    },
    unbind(el: HTMLElement): void {
      el.removeEventListener(this.event, this.handler, false);
    }
  }

};

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
