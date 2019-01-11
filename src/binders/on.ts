import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";

interface BinderContext {
  listener: (event: Event) => void;
  handler: (...args: any[]) => void;
}

const binder: Binder<BinderContext> = {
  argumentRequired: true,

  bind(el: HTMLElement, binding: Binding): void {
    const self: BinderContext = this;
    this.listener = function listener(event: Event): void {
      if (typeof self.handler === "function") {
        self.handler.call(binding.context, event, this);
      } else {
        throw new Error(
          `The target value bound with "${
            binding.attrValue
          }" is not a valid handler for event "${binding.argument}"`
        );
      }
    };
    el.addEventListener(binding.argument, this.listener, false);
  },

  routine(el: HTMLElement, handler: any): void {
    this.handler = handler;
  },

  unbind(el: HTMLElement, binding: Binding): void {
    el.removeEventListener(binding.argument, this.listener, false);
    this.listener = undefined;
    this.handler = undefined;
  }
};

export default binder;
