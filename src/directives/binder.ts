import { IBinder, IBinderRoutine } from "../interfaces/IBinder";
import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";
import { IValueSpecification } from "../interfaces/IValueSpecification";

export function buildBinderDirective(binding: IBinding, definition: IBinder | IBinderRoutine): IDirective {
  const binder: IBinder = typeof definition === "function" ? { routine: definition } : definition;

  const el: HTMLElement = binding.el;
  let context: any;

  function applyValueSpecification(value: any, spec: IValueSpecification): any {
    if (value === null || value === undefined) {
      if (spec.required === true) {
        throw new Error(`The required bound value "${binding.attrValue}" is not defined`);
      }
      if (spec.hasOwnProperty("default")) {
        value = spec.default;
      }
    } else {
      if (typeof spec.type === "string" && typeof value !== spec.type) {
        throw new Error(`The bound value "${binding.attrValue}" is not a "${spec.type}"`);
      }
      if (typeof spec.type === "function" && !(value instanceof spec.type)) {
        throw new Error(`The bound value "${binding.attrValue}" is not an instance of ${spec.type}`);
      }
      if (spec.validator) {
        const valid: boolean = spec.validator.call(context, value);
        if (!valid) {
          throw new Error(`The bound value "${value}" from "${binding.attrValue}" is not valid`);
        }
      }
    }

    return value;
  }

  function bind(): void {
    // argument required check
    if (binder.argumentRequired === true) {
      if (!binding.argument) {
        throw new Error(`The binder ${binding.directive} requires an argument`);
      }
    }

    // remove the binding argument
    binding.el.removeAttribute(binding.attrName);

    // create an empty context
    context = {};

    // trigger bind hook
    if (binder.bind) {
      binder.bind.call(context, el, binding);
    }
  }

  function refresh(): void {
    // get the current value
    let value: any = binding.get();

    // apply value validation
    if (binder.value) {
      value = applyValueSpecification(value, binder.value);
    }

    // execute binder routine
    if (binder.routine) {
      binder.routine.call(context, el, value, binding);
    }
  }

  function unbind(): void {
    // trigger unbind hook
    if (binder.unbind) {
      binder.unbind.call(context, el, binding);
    }

    // reset context
    context = undefined;

    // restore original DOM attribute
    binding.el.setAttribute(binding.attrName, binding.attrValue);
  }

  return {
    bind,
    refresh,
    unbind
  };
}
