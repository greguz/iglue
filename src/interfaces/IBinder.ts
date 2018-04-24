import { IBinding } from "./IBinding";

export type IBinderRoutine<T = any> = (this: T, value: any, binding: IBinding) => void;

export interface IBinder<T = any> {

  /**
   * Triggered when the binding is created
   */

  bind?: (this: T, binding: IBinding) => void;

  /**
   * Triggered when the watched value changes
   */

  routine?: IBinderRoutine<T>;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?: (this: T, binding: IBinding) => void;

}
