import { IBinder, IBinderHook } from "../interfaces/IBinder";
import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";

export function buildBinderDirective(binding: IBinding, binder: IBinder | IBinderHook): IDirective {
  const normalized: IBinder = typeof binder === "function" ? { routine: binder } : binder;

  let context: any;

  function bind(): void {
    binding.el.removeAttribute(binding.attrName);
    context = {};
    if (normalized.bind) {
      normalized.bind.call(context, binding);
    }
  }

  function routine(): void {
    if (normalized.routine) {
      normalized.routine.call(context, binding);
    }
  }

  function unbind(): void {
    if (normalized.unbind) {
      normalized.unbind.call(context, binding);
    }
    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    bind,
    routine,
    unbind
  };
}
