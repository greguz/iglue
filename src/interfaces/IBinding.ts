import { IAttributeInfo } from "./IAttributeParser";
import { IObserver } from "./IObserver";

export interface IBinding extends Readonly<IAttributeInfo> {

  /**
   * Bound element
   */

  readonly el: HTMLElement;

  /**
   * Bound observers
   */

  observers: IObserver[];

  /**
   * Get value from model
   */

  get(): any;

  /**
   * Update model value
   */

  set(value: any): void;

}
