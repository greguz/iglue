import { IBinder } from "../interfaces/IBinder";
import { IBinding } from "../interfaces/IBinding";
import { IDirective } from "../interfaces/IDirective";

export class BinderDirective implements IDirective {

  /**
   * Attribute binding
   */

  private binding: IBinding;

  /**
   * Binder context
   */

  private context: any;

  /**
   * Target binder
   */

  private binder: IBinder;

  /**
   * @constructor
   */

  constructor(binding: IBinding, binder: any) { // TODO types
    this.binding = binding;
    this.context = undefined;
    if (typeof binder === "function") {
      this.binder = { routine: binder };
    } else {
      this.binder = binder;
    }
  }

  /**
   * Create a new context and start the binding with the DOM
   */

  public bind(): void {
    if (this.context) {
      throw new Error("Binding is active");
    }
    this.binding.el.removeAttribute(this.binding.attributeName);
    this.context = {};
    if (this.binder.bind) {
      this.binder.bind.call(this.context, this.binding);
    }
  }

  /**
   * Write a value to the DOM
   */

  public routine(): void {
    if (!this.context) {
      throw new Error("Binding is not active");
    }
    if (this.binder.routine) {
      this.binder.routine.call(this.context, this.binding);
    }
  }

  /**
   * Stop DOM listening and reset the context
   */

  public unbind(): void {
    if (!this.context) {
      throw new Error("Binding is not active");
    }
    if (this.binder.unbind) {
      this.binder.unbind.call(this.context, this.binding);
    }
    this.binding.el.setAttribute(this.binding.attributeName, this.binding.attributeValue);
    this.context = undefined;
  }

}
