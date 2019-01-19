/**
 * Component definition interface
 */
export interface Component {
  /**
   * HTML template
   */
  template?: string;

  /**
   * Custom rendering function
   */
  render?(): HTMLElement;

  /**
   * 1. Data is available
   */
  create?(): void;

  /**
   * 2. Reactivity and DOM is ready
   */
  bind?(): void;

  /**
   * 3. Attached into DOM
   */
  attach?(): void;

  /**
   * 4. Detached from DOM
   */
  detach?(): void;

  /**
   * 5. DOM uninitialized
   */
  unbind?(): void;

  /**
   * 6. Data is still here
   */
  destroy?(): void;

  /**
   * Build default component data
   */
  data?(): object;
}
