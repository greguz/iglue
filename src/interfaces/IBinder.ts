import { IBinding } from "./IBinding";

export type IBinderRoutine<T = any> = (this: T, el: HTMLElement, value: any, binding: IBinding) => void;

export interface IBinder<T = any> {

  /**
   * Triggered when the binding is created
   */

  bind?: (this: T, el: HTMLElement, binding: IBinding) => void;

  /**
   * Triggered when the watched value changes
   */

  routine?: IBinderRoutine<T>;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?: (this: T, el: HTMLElement, binding: IBinding) => void;

}
