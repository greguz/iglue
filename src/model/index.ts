import { IModel, IModelCallback } from "../interfaces/IModel";
import { IObserver } from "../interfaces/IObserver";

import { PathObserver } from "./PathObserver";

function buildObserver(obj: object, path: string, callback: IModelCallback): IObserver {
  const po: PathObserver = new PathObserver(obj, path);
  let watching: boolean = false;

  // get current value
  function get(): any {
    return po.get();
  }

  // set value to
  function set(value: any): void {
    po.set(value);
  }

  // watch for changes
  function watch(): void {
    if (watching === false) {
      po.observe(callback);
      watching = true;
    }
  }

  // stop watching
  function ignore(): void {
    if (watching === true) {
      po.unobserve();
      watching = false;
    }
  }

  // get current watching status
  function isWatching(): boolean {
    return watching;
  }

  // return observer
  return {
    get,
    set,
    watch,
    ignore,
    isWatching
  };
}

export function buildModel(obj: object): IModel {
  if (typeof obj !== 'object') {
    throw new Error('The model data is not an object');
  }

  function observe(path: string, callback: IModelCallback): IObserver {
    return buildObserver(obj, path, callback);
  }

  return {
    observe
  };
}
