/**
 * Component definition interface
 */

export interface Component<T = any> {
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

  attach?: (this: T) => void;

  /**
   * Both DOM and data-binding are initialized
   */

  bind?: (this: T) => void;

  /**
   * The data-binding and the DOM are still running
   */

  unbind?: (this: T) => void;

  /**
   * The data-binding is stopped, the DOM is still untached
   */

  detach?: (this: T) => void;

  /**
   * Both data-biding and DOM are dead
   */

  destroy?: (this: T) => void;
}
