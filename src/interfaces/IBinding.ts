import { IObserver } from "./IObserver";

export interface IBinding {

  /**
   * Bound element
   */

  readonly el: HTMLElement;

  /**
   * Raw attribute name
   */

  readonly attributeName: string;

  /**
   * Raw attribute value
   */

  readonly attributeValue: string;

  /**
   * Binding name
   */

  readonly name: string;

  /**
   * Value path
   */

  readonly path: string;

  /**
   * Binding argument
   * @example wd-test:arg="event.name"
   */

  readonly arg: string | null;

  /**
   * Modal observer for this path
   */

  readonly observer: IObserver;

  /**
   * Get the parsed value from model
   */

  get(): any;

  /**
   * Set the parsed value into model
   */

  set(value: any): void;

}
