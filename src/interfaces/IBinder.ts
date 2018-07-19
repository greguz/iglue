import { IBinding } from "./IBinding";
import { IValueSpecification } from "./IValueSpecification";

export type IBinderRoutine<T = any, V = any> = (this: T, el: HTMLElement, value: V, binding: IBinding) => void;

export interface IBinder<T = any, V = any> {

  /**
   * Enforce binding argument
   */

  argumentRequired?: boolean;

  /**
   * Bound value configuration
   */

  value?: IValueSpecification<V>;

  /**
   * Triggered when the binding is created
   */

  bind?: (this: T, el: HTMLElement, binding: IBinding) => void;

  /**
   * Triggered when the watched value changes
   */

  routine?: IBinderRoutine<T, V>;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?: (this: T, el: HTMLElement, binding: IBinding) => void;

}
