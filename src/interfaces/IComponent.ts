import { View } from "../View";

export interface IComponent<T = any> {

  /**
   * The component HTML template
   */

  template: string;

  /**
   * Component loaded, data-binding and DOM not initialized
   */

  create?(this: T): void;

  /**
   * DOM initialized, data-binding is not running
   */

  attach?(this: T, el: HTMLElement): void;

  /**
   * Both DOM and data-binding are initialized
   */

  bind?(this: T, view: View): void;

  /**
   * The data-binding and the DOM are still running
   */

  unbind?(this: T, view: View): void;

  /**
   * The data-binding is stopped, the DOM is still untached
   */

  detach?(this: T, el: HTMLElement): void;

  /**
   * Both data-biding and DOM are dead
   */

  destroy?(this: T): void;

}
