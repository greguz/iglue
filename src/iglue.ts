import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
import { Formatter, IFormatter } from "./interfaces/IFormatter";
import { IView } from "./interfaces/IView";

import { View, IViewOptions } from "./View";

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

  disabled(value: any, binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !!value;
  },

  enabled(value: any, binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !value;
  },

  hide(value: any, binding: IBinding): void {
    binding.el.style.display = value ? "none" : "";
  },

  show(value: any, binding: IBinding): void {
    binding.el.style.display = value ? "" : "none";
  },

  html(value: any, binding: IBinding): void {
    binding.el.innerHTML = value == null ? "" : value;
  },

  text(value: any, binding: IBinding): void {
    const el: HTMLElement = binding.el;
    if (el.textContent) {
      el.textContent = value == null ? "" : value;
    } else {
      el.innerText = value == null ? "" : value;
    }
  },

  on: {
    routine(handler: any, binding: IBinding): void {
      binding.el.removeEventListener(binding.arg, this.handler, false);
      binding.el.addEventListener(binding.arg, handler, false);
      this.handler = handler;
    },
    unbind(binding: IBinding): void {
      binding.el.removeEventListener(binding.arg, this.handler, false);
    }
  },

  class(value: any, binding: IBinding): void {
    const el: HTMLElement = binding.el;
    if (binding.arg) {
      if (!value) {
        el.classList.remove(binding.arg);
      } else {
        el.classList.add(binding.arg);
      }
    } else {
      el.className = value;
    }
  },

  value: {
    bind(binding: IBinding): void {
      this.handler = () => {
        binding.set(
          (binding.el as HTMLFormElement).value
        );
      };
      this.event = binding.el.tagName === "SELECT" ? "change" : "input";
      binding.el.addEventListener(this.event, this.handler, false);
    },
    routine(value: any, binding: IBinding): void {
      (binding.el as HTMLFormElement).value = value == null ? '' : value;
    },
    unbind(binding: IBinding): void {
      binding.el.removeEventListener(this.event, this.handler, false);
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

export const formatters: ICollection<Formatter | IFormatter> = {};

/**
 * Bind a new view
 */

export function bind(el: HTMLElement, data: object, options?: IViewOptions): IView {
  options = options || {};

  // inject global binders
  if (options.binders) {
    for (const key in binders) {
      options.binders[key] = options.binders[key] || binders[key];
    }
  } else {
    options.binders = binders;
  }

  // inject global components
  if (options.components) {
    for (const key in components) {
      options.components[key] = options.components[key] || components[key];
    }
  } else {
    options.components = components;
  }

  // inject global formatters
  if (options.formatters) {
    for (const key in formatters) {
      options.formatters[key] = options.formatters[key] || formatters[key];
    }
  } else {
    options.formatters = formatters;
  }

  // create the view and return
  const view = new View(el, data, options);
  view.bind();
  return view;
}
