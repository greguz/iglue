import { IBinder, IBinderRoutine } from "../interfaces/IBinder";
import { IBinding } from "../interfaces/IBinding";
import { ICollection } from "../interfaces/ICollection";

import $class from "./class";

const binders: ICollection<IBinder | IBinderRoutine> = {

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

  class: $class,

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

export default binders;
