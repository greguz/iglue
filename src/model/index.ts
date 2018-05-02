import { IModel } from "../interfaces/IModel";
import { IObserver } from "../interfaces/IObserver";

import { PathObserver } from "./PathObserver";

function buildObserver(obj: object, path: string, isWatching: () => boolean): IObserver {
  const po: PathObserver = new PathObserver(obj, path);

  // registered callback
  let callback: () => void;

  // fire the routine for all bound directives
  function routine(): void {
    if (callback && isWatching()) {
      callback();
    }
  }

  // get current value
  function get(): any {
    return po.get();
  }

  // set value to
  function set(value: any): void {
    po.set(value);
  }

  // notify changes to a target directive
  function notify(fn: () => void) {
    callback = fn;
  }

  // watch value changes
  po.observe(routine);

  // return observer
  return {
    get,
    set,
    notify
  };
}

export function buildModel(obj: object): IModel {
  if (typeof obj !== "object") {
    throw new Error("The model data is not an object");
  }

  let watching: boolean = false;

  function isWatching(): boolean {
    return watching;
  }

  function observe(path: string): IObserver {
    return buildObserver(obj, path, isWatching);
  }

  function start(): void {
    watching = true;
  }

  function stop(): void {
    watching = false;
  }

  return {
    observe,
    start,
    stop
  };
}
