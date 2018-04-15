export interface IDirective {

  /**
   * Target model value path to watch
   */

  readonly path: string;

  /**
   * Run directive
   */

  bind: (publish?: (value: any) => void) => void;

  /**
   * Notify the directive that the wathed value is changed
   */

  write: (value: any) => void;

  /**
   * Stop directive
   */

  unbind: () => void;

}
