import { Binder } from "../interfaces/Binder";
import { Binding } from "../interfaces/Binding";

type BoundElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface BinderContext {
  event: string;
  listener: EventListener;
}

function getEvent(el: BoundElement): string {
  if ((el.tagName === "INPUT" && el.type !== "checkbox" && el.type !== "radio") || el.tagName === "TEXTAREA") {
    return "input";
  } else {
    return "change";
  }
}

function getListener(el: BoundElement, binding: Binding): EventListener {
  if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) {
    return function listener(): void {
      binding.set((el as HTMLInputElement).checked);
    };
  } else {
    return function listener(): void {
      binding.set(el.value);
    };
  }
}

const binder: Binder<BinderContext> = {

  bind(el: BoundElement, binding: Binding): void {
    this.event = getEvent(el);
    this.listener = getListener(el, binding);
    el.addEventListener(this.event, this.listener, false);
  },

  routine(el: BoundElement, value: any): void {
    if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) {
      (el as HTMLInputElement).checked = !!value;
    } else {
      el.value = value === undefined || value === null ? "" : value.toString();
    }
  },

  unbind(el: BoundElement): void {
    el.removeEventListener(this.event, this.listener, false);
  }

};

export default binder;
