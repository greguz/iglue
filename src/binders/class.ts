import { IBinder } from '../interfaces/IBinder';
import { IBinding } from '../interfaces/IBinding';

import { includes, isArray } from '../utils';

interface IBinderContext {
  classes: string[];
}

const binder: IBinder<IBinderContext> = {

  bind(): void {
    // initialize the class array
    this.classes = [];
  },

  routine(el: HTMLElement, value: any, binding: IBinding): void {
    if (binding.argument) {
      // toggle class by value
      if (!value) {
        el.classList.remove(binding.argument);
      } else {
        el.classList.add(binding.argument);
      }
    } else {
      // get the previously saved classes
      const oldClasses: string[] = this.classes;

      // get the new class list
      let newClasses: string[];
      if (typeof value === 'string') {
        newClasses = value.match(/\S+/g);
      } else if (isArray(value)) {
        newClasses = value;
      } else {
        newClasses = [];
      }

      // handle removed classes
      for (const cName of oldClasses) {
        if (!includes(newClasses, cName)) {
          el.classList.remove(binding.argument);
        }
      }

      // handle added classes
      for (const cName of newClasses) {
        if (!includes(oldClasses, cName)) {
          el.classList.add(binding.argument);
        }
      }

      // save current status
      this.classes = newClasses;
    }
  },

  unbind(): void {
    // free resources
    this.classes = undefined;
  }

};

export default binder;
