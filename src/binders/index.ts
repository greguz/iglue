import { Binder, BinderRoutine } from "../interfaces/Binder";
import { Collection } from "../utils";

import $class from "./class";
import $on from "./on";
import $value from "./value";

const binders: Collection<Binder | BinderRoutine> = {

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
    el.innerHTML = value == null ? "" : value;
  },

  text(el: HTMLElement, value: any): void {
    if (el.textContent) {
      el.textContent = value == null ? "" : value;
    } else {
      el.innerText = value == null ? "" : value;
    }
  }

};

export default binders;
