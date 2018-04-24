import { IBinder, IBinderRoutine } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";

/**
 * Included default binders
 */

export const binders: ICollection<IBinder | IBinderRoutine> = {

  disabled: function disabled(value: any, binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !!value;
  },

  enabled: function enabled(value: any, binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !value;
  },

  hide: function hide(value: any, binding: IBinding): void {
    binding.el.style.display = value ? 'none' : '';
  },

  show: function show(value: any, binding: IBinding): void {
    binding.el.style.display = value ? '' : 'none';
  },

  html: function html(value: any, binding: IBinding): void {
    binding.el.innerHTML = value == null ? '' : value;
  },

  text: function text(value: any, binding: IBinding): void {
    const el: HTMLElement = binding.el;
    if (el.textContent) {
      el.textContent = value == null ? '' : value;
    } else {
      el.innerText = value == null ? '' : value;
    }
  }

};
