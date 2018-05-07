import { IBinder, IBinderRoutine } from "./IBinder";
import { ICollection } from "./ICollection";
import { IComponent } from "./IComponent";
import { Formatter, IFormatter } from "./IFormatter";

export interface IView {

  /**
   * Bound DOM element
   */

  readonly el: HTMLElement;

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

  /**
   * Returns true when the view is bound to the element
   */

  isBound(): boolean;

}

export interface IViewOptions {
  prefix?: string;
  binders?: ICollection<IBinder | IBinderRoutine>;
  components?: ICollection<IComponent>;
  formatters?: ICollection<Formatter | IFormatter>;
}
