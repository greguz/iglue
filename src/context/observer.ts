import { Observer, ObserverCallback } from "../interfaces/Observer";
import { buildValueGetter, buildValueSetter } from "../utils";
import { observePath, unobservePath } from "./path";

/**
 * Create a new observer instance
 */

export function buildObserver(obj: any, path: string, callback: ObserverCallback): Observer {
  observePath(obj, path, callback);
  return {
    get: buildValueGetter(obj, path),
    set: buildValueSetter(obj, path),
    unobserve(): void {
      unobservePath(obj, path, callback);
    }
  };
}
