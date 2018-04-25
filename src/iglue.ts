import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";
import { IComponent } from "./interfaces/IComponent";
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
  }

};

/**
 * Global components
 */

export const components: ICollection<IComponent> = {};

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

  // create the view and return
  const view = new View(el, data, options);
  view.bind();
  return view;
}
