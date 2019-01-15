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
   * 1. Data is available
   */
  create?: (this: T) => void;

  /**
   * 2. Reactivity and DOM is ready
   */
  bind?: (this: T) => void;

  /**
   * 3. Attached into DOM
   */
  attach?: (this: T) => void;

  /**
   * 4. Detached from DOM
   */
  detach?: (this: T) => void;

  /**
   * 5. DOM uninitialized
   */
  unbind?: (this: T) => void;

  /**
   * 6. Data is still here
   */
  destroy?: (this: T) => void;
}
