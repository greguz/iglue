import { IDirective } from "../interfaces/IDirective";
import { IModel } from "../interfaces/IModel";
import { IObserver } from "../interfaces/IObserver";

import { PathObserver } from "./PathObserver";

function buildObserver(obj: object, path: string): IObserver {
  const directives: IDirective[] = [];
  const po: PathObserver = new PathObserver(obj, path);

  let watching: boolean = false;

  // fire the routine for all bound directives
  function routine() {
    for (const directive of directives) {
      directive.routine();
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

  // watch for changes
  function watch(): void {
    if (watching === false) {
      po.observe(routine);
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
    isWatching,
    bindTo: directives.push.bind(directives)
  };
}

export function buildModel(obj: object): IModel {
  if (typeof obj !== 'object') {
    throw new Error('The model data is not an object');
  }

  function observe(path: string): IObserver {
    return buildObserver(obj, path);
  }

  return {
    observe
  };
}
