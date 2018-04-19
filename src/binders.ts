import { IBinder, IBinderHook } from "./interfaces/IBinder";
import { IBinding } from "./interfaces/IBinding";
import { ICollection } from "./interfaces/ICollection";

/**
 * Included default binders
 */

export const binders: ICollection<IBinder | IBinderHook> = {

  disabled: function disabled(binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !!binding.get();
  },

  enabled: function enabled(binding: IBinding): void {
    (binding.el as HTMLFormElement).disabled = !binding.get();
  },

  hide: function hide(binding: IBinding): void {
    binding.el.style.display = binding.get() ? 'none' : '';
  },

  show: function show(binding: IBinding): void {
    binding.el.style.display = binding.get() ? '' : 'none';
  },

  html: function html(binding: IBinding): void {
    const value: string = binding.get();
    binding.el.innerHTML = value == null ? '' : value;
  },

  text: function text(binding: IBinding): void {
    const el: HTMLElement = binding.el;
    const value: string = binding.get();
    if (el.textContent) {
      el.textContent = value == null ? '' : value;
    } else {
      el.innerText = value == null ? '' : value;
    }
  }

};
