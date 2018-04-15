import { observe, unobserve } from "./observe"

export type Callback = () => void;

interface Observer {
  property: string;
  listener: Callback;
}

export class Model {

  private data: any;

  private observers: Observer[];

  constructor(data: any) {
    this.data = data;
    this.observers = [];
  }

  public observe(property: string, listener: Callback): void {
    this.observers.push({
      property,
      listener
    });
    observe(this.data, property, listener);
  }

  public unobserve(): void {
    for (const observer of this.observers) {
      unobserve(this.data, observer.property, observer.listener);
    }
    this.observers = [];
  }

  public get(property: string): any {
    return this.data[property];
  }

  public set(property: string, value: any): void {
    this.data[property] = value;
  }

}
