import { IBinding } from "./IBinding";

export type IBinderHook<T = any> = (this: T, binding: IBinding) => void;

export interface IBinder<T = any> {

  /**
   * Triggered when the binding is created
   */

  bind?: IBinderHook<T>;

  /**
   * Triggered when the watched value changes
   */

  routine?: IBinderHook<T>;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?: IBinderHook<T>;

}
