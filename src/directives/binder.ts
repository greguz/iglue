import { IBinder, IBinderRoutine, IBinderValue } from "../interfaces/IBinder";
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
    let value: any = binding.get();

    if (binder.value) {
      const options: IBinderValue = binder.value;

      if (value === null || value === undefined) {
        if (options.required) {
          throw new Error(`The required bound value "${binding.attrValue}" is not defined`);
        }
        if (options.default !== undefined) {
          value = options.default;
        }
      } else {
        if (typeof options.type === "string" && typeof value !== options.type) {
          throw new Error(`The bound value "${binding.attrValue}" is not a "${options.type}"`);
        }
        if (typeof options.type === "function" && !(value instanceof options.type)) {
          throw new Error(`The bound value "${binding.attrValue}" is not an instance of ${options.type}`);
        }

        if (options.validator) {
          const valid: boolean = options.validator.call(context, value);

          if (!valid) {
            throw new Error(`The bound value "${value}" from "${binding.attrValue}" is not valid`);
          }
        }
      }
    }

    if (binder.routine) {
      binder.routine.call(context, el, value, binding);
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
