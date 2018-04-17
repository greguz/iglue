import { IObserver } from "./IObserver";

/**
 * Called when the value changes
 */

export type IModelCallback = (value: any) => void;

/**
 * Data model container, expose a single function to create observers
 */

export interface IModel {

  /**
   * Observe a path value
   */

  observe(path: string, callback: IModelCallback): IObserver;

}
