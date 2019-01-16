import { includes, isArray } from "../utils";

import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";

interface BinderContext {
  classes: string[] | undefined;
}

const binder: Binder<BinderContext> = {
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
      const oldClasses: string[] = this.classes || [];

      // get the new class list
      let newClasses: string[];
      if (typeof value === "string" && value !== "") {
        newClasses = value.match(/\S+/g) || [];
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
      this.classes = [...newClasses];
    }
  },

  unbind(el: HTMLElement, binding: Binding): void {
    if (binding.argument) {
      el.classList.remove(binding.argument);
    } else {
      const classes = this.classes || [];
      for (const cName of classes) {
        el.classList.remove(cName);
      }
    }
  }
};

export default binder;
