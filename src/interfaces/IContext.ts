import { IContext } from "./IContext";
import { IObserver, IObserverCallback } from "./IObserver";

/**
 * The observed object, aka the context of our application
 */

export type IContext<T extends object = {}> = T & IContextPrototype;

/**
 * Injected context methods and utilities
 */

export interface IContextPrototype {

  /**
   * Observe a context path value
   */

  $observe(path: string, callback?: IObserverCallback): IObserver;

  /**
   * Enable all generated observers
   */

  $start(): void;

  /**
   * Disable all generated observers
   */

  $stop(): void;

}
