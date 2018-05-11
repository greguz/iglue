import { IView } from "./IView";

export interface IComponent<T = any> {

  /**
   * HTML template
   */

  template?: string;

  /**
   * Custom rendering function
   */

  render?: (this: T) => HTMLElement;

  /**
   * Component loaded, data-binding and DOM not initialized
   */

  create?: (this: T) => void;

  /**
   * DOM initialized, data-binding is not running
   */

  attach?: (this: T, el: HTMLElement) => void;

  /**
   * Both DOM and data-binding are initialized
   */

  bind?: (this: T, view: IView) => void;

  /**
   * The data-binding and the DOM are still running
   */

  unbind?: (this: T, view: IView) => void;

  /**
   * The data-binding is stopped, the DOM is still untached
   */

  detach?: (this: T, el: HTMLElement) => void;

  /**
   * Both data-biding and DOM are dead
   */

  destroy?: (this: T) => void;

}
