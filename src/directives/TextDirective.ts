import { IDirective } from "../interfaces/IDirective";
import { IObserver } from "../interfaces/IObserver";

export class TextDirective implements IDirective {

  private node: Text;

  private observer: IObserver;

  constructor(node: Text, observer: IObserver) {
    this.node = node;
    this.observer = observer;
  }

  public bind(): void {
    // nothing to do
  }

  public routine(): void {
    const value: any = this.observer.get();
    this.node.data = value == null ? "" : value.toString();
  }

  public unbind(): void {
    // noting to do
  }

}
