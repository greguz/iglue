import { IBinding } from "./IBinding";

export interface IBinder {

  /**
   * Triggered when the binding is created
   */

  bind?(this: any, binding: IBinding): void;

  /**
   * Triggered when the watched value changes
   */

  routine?(this: any, binding: IBinding): void;

  /**
   * Triggered when the binding is destroyed
   */

  unbind?(this: any, binding: IBinding): void;

}
