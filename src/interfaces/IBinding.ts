import { IAttributeInfo } from "./IAttributeParser";
import { ICollection } from "./ICollection";

export interface IBinding extends Readonly<IAttributeInfo> {

  /**
   * Bound element
   */

  readonly el: HTMLElement;

  /**
   * Binding object context
   */

  readonly context: ICollection<any>;

  /**
   * Get value from model
   */

  get(): any;

  /**
   * Update model value
   */

  set(value: any): void;

}
