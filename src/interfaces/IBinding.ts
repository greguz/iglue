import { IAttributeInfo } from "./IAttributeParser";
import { IContext } from "./IContext";

export interface IBinding extends Readonly<IAttributeInfo> {

  /**
   * Bound element
   */

  readonly el: HTMLElement;

  /**
   * Binding object context
   */

  readonly context: IContext;

  /**
   * Get value from model
   */

  get(): any;

  /**
   * Update model value
   */

  set(value: any): void;

}
