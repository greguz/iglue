import { IBinding } from "./IBinding";

export type IBinderRoutine<T = any, V = any> = (this: T, el: HTMLElement, value: V, binding: IBinding) => void;

export interface IBinderValue<V = any> {

  /**
   * Defaul value
   */

  default?: V;

  /**
   * True to reject null and undefined
   */

  required?: boolean;

  /**
   * Required "typeof" return value
   */

  type?: string | Function;

  /**
   * Custom validation
   */

  validator?: (value: any) => boolean;

}

export interface IBinder<T = any, V = any> {

  /**
   * Bound value configuration
   */

  value?: IBinderValue<V>;

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
