import { Binder, BinderRoutine } from "../interfaces/Binder";

import { isNil } from "../utils/language";
import { Collection } from "../utils/type";

import $class from "./class";
import $on from "./on";
import $value from "./value";

export const binders: Collection<Binder | BinderRoutine> = {
  class: $class,
  on: $on,
  value: $value,

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
    el.innerHTML = isNil(value) ? "" : value;
  },

  text(el: HTMLElement, value: any): void {
    value = isNil(value) ? "" : value;

    if (el.textContent) {
      el.textContent = value;
    } else {
      el.innerText = value;
    }
  }
};
