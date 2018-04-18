import { IAttributeInfo } from "./IAttributeInfo";

export interface IBinding extends Readonly<IAttributeInfo> {

  /**
   * Bound element
   */

  readonly el: HTMLElement;

  /**
   * Get value from model
   */

  get(): any;

  /**
   * Update model value
   */

  set(value: any): void;

}
