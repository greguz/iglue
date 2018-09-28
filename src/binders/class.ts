import { includes, isArray } from "../utils";

import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";

interface BinderContext {
  classes: string[];
}

const binder: Binder<BinderContext> = {

  bind(): void {
    // initialize the class array
    this.classes = [];
  },

  routine(el: HTMLElement, value: any, binding: Binding): void {
    if (binding.argument) {
      // toggle class by value
      if (value) {
        el.classList.add(binding.argument);
      } else {
        el.classList.remove(binding.argument);
      }
    } else {
      // get the previously saved classes
      const oldClasses: string[] = this.classes;

      // get the new class list
      let newClasses: string[];
      if (typeof value === "string" && value !== "") {
        newClasses = value.match(/\S+/g);
      } else if (isArray(value)) {
        newClasses = value;
      } else {
        newClasses = [];
      }

      // handle removed classes
      for (const cName of oldClasses) {
        if (!includes(newClasses, cName)) {
          el.classList.remove(cName);
        }
      }

      // handle added classes
      for (const cName of newClasses) {
        if (!includes(oldClasses, cName)) {
          el.classList.add(cName);
        }
      }

      // save current status
      this.classes = newClasses;
    }
  },

  unbind(el: HTMLElement, binding: Binding): void {
    // remove explicit class
    if (binding.argument) {
      el.classList.remove(binding.argument);
    }

    // remove dynamic classes
    for (const cName of this.classes) {
      el.classList.remove(cName);
    }

    // free resources
    this.classes = undefined;
  }

};

export default binder;
