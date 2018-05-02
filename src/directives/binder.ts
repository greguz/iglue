import { IBinder, IBinderRoutine } from "../interfaces/IBinder";
import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";

export function buildBinderDirective(binding: IBinding, definition: IBinder | IBinderRoutine): IDirective {
  const binder: IBinder = typeof definition === "function" ? { routine: definition } : definition;

  const el: HTMLElement = binding.el;
  let context: any;

  function bind(): void {
    binding.el.removeAttribute(binding.attrName);
    context = {};
    if (binder.bind) {
      binder.bind.call(context, el, binding);
    }
  }

  function refresh(): void {
    if (binder.routine) {
      binder.routine.call(context, el, binding.get(), binding);
    }
  }

  function unbind(): void {
    if (binder.unbind) {
      binder.unbind.call(context, el, binding);
    }
    context = undefined;
    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    bind,
    refresh,
    unbind
  };
}
