import { IBinding } from "./IBinding";

export interface IDirective {

  /**
   * Run directive
   */

  bind(binding: IBinding): void;

  /**
   * Notify the directive that the wathed value is changed
   */

  update(binding: IBinding): void;

  /**
   * Stop directive
   */

  unbind(binding: IBinding): void;

}
