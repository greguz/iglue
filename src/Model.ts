import { PathObserver } from "./PathObserver";

export class Model {

  private data: any;

  private observers: PathObserver[];

  constructor(data: any) {
    this.data = data;
    this.observers = [];
  }

  public observe(path: string, listener: (value: any) => void): void {
    const observer = new PathObserver(this.data, path);
    observer.observe(listener);
    this.observers.push(observer);
  }

  public unobserve(): void {
    for (const observer of this.observers) {
      observer.unobserve();
    }
    this.observers = [];
  }

  public get(path: string): any {
    for (const observer of this.observers) {
      if (observer.path === path) {
        return observer.get();
      }
    }
  }

  public set(path: string, value: any): void {
    for (const observer of this.observers) {
      if (observer.path === path) {
        return observer.set(value);
      }
    }
  }

}
