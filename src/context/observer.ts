import { Observer, ObserverCallback } from "../interfaces/Observer";
import { buildValueGetter, buildValueSetter } from "../utils";
import { observePath, unobservePath } from "./path";

/**
 * Create a new observer instance
 */

export function buildObserver(obj: any, path: string, callback: ObserverCallback): Observer {
  if (typeof callback !== "function" && callback !== null) {
    throw new Error("The observer callback must be a function or null");
  }
  if (callback) {
    observePath(obj, path, callback);
  }
  return {
    get: buildValueGetter(obj, path),
    set: buildValueSetter(obj, path),
    unobserve(): void {
      if (callback) {
        unobservePath(obj, path, callback);
      }
    }
  };
}
