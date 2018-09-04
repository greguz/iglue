/**
 * Represents an active view
 */

export interface Directive {

  /**
   * Re-render the UI
   */

  refresh(value: any): void;

  /**
   * Destroy and unload the resources
   */

  unbind(): void;

}
