import { IDirective } from "../interfaces/IDirective";
import { IObserver } from "../interfaces/IObserver";

export function buildTextDirective(node: Text, observer: IObserver): IDirective {
  function bind(): void {
    // nothing to do
  }

  function routine(): void {
    const value: any = observer.get();
    node.data = value == null ? "" : value.toString();
  }

  function unbind(): void {
    // nothing to do
  }

  return {
    bind,
    routine,
    unbind
  };
}
