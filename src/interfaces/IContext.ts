import { ICollection } from "./ICollection";
import { IContext } from "./IContext";
import { IObserver, IObserverCallback } from "./IObserver";

/**
 * The observed data object
 */

export interface IContext extends ICollection<any> {

  /**
   * Observe a context path value
   */

  $observe(path: string, callback?: IObserverCallback): IObserver;

  /**
   * Clone the context into another object
   */

  $clone(): IContext;

}
