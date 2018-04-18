export interface IView {

  /**
   * Bound node
   */

  readonly node: HTMLElement;

  /**
   * Bound data model
   */

  readonly data: object;

  /**
   * Start data binding
   */

  bind(): void;

  /**
   * Refresh rendered values
   */

  refresh(): void;

  /**
   * Stop data binding
   */

  unbind(): void;

  /**
   * Clone the current view configuration and optinally the model
   */

  clone(node: HTMLElement, data?: object): IView;

}
