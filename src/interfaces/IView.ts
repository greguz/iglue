import { IBinder, IBinderRoutine } from "./IBinder";
import { ICollection } from "./ICollection";
import { IComponent } from "./IComponent";
import { IContext } from "./IContext";
import { Formatter, IFormatter } from "./IFormatter";

export interface IView<A extends object = {}> {

  /**
   * Bound DOM element
   */

  readonly el: HTMLElement;

  /**
   * Bound data model
   */

  readonly context: IContext<A>;

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

  clone<B extends object = {}>(el: HTMLElement, data?: B): IView<B>;

  /**
   * Returns true when the view is bound to the element
   */

  isBound(): boolean;

}

export interface IViewOptions {

  /**
   * Global binders prefix
   */

  prefix?: string;

  /**
   * Binders collection
   */

  binders?: ICollection<IBinder | IBinderRoutine>;

  /**
   * Components collection
   */

  components?: ICollection<IComponent>;

  /**
   * Formatters collection
   */

  formatters?: ICollection<Formatter | IFormatter>;

}
