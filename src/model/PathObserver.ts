import { isArray } from "./array";
import { observeProperty, unobserveProperty } from "./object";

export class PathObserver {

  /**
   * Base object to observe
   */

  public data: any;

  /**
   * Value path to observe
   */

  public path: string;

  /**
   * Tokenized path
   */

  private tokens: string[];

  /**
   * Current path values
   */

  private values: any[];

  /**
   * Registered change callback
   */

  private callback: (newValue: any, oldValue: any) => void;

  /**
   * @constructor
   */

  constructor(data: any, path: string) {
    this.data = data;
    this.path = path;
    this.tokens = path.split(".");
    this.update = this.update.bind(this);
  }

  /**
   * Start data observing
   */

  public observe(callback: (newValue: any, oldValue: any) => void): void {
    if (this.callback) {
      throw new Error("Currently observing");
    }

    this.callback = callback;

    const tokens: string[] = this.tokens;
    const values: any[] = this.realize();

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const obj: any = values[i];

      if (typeof obj === "object" && obj !== null) {
        observeProperty(
          obj,
          token,
          this.update
        );
      }
    }

    this.values = values;
  }

  /**
   * Get the current value
   */

  public get(): any {
    let obj: any = this.data;

    for (const token of this.tokens) {
      if (typeof obj === "object") {
        obj = obj[token];
      } else {
        return undefined;
      }
    }

    return obj;
  }

  /**
   * Set the value
   */

  public set(value: any): void {
    const tokens: string[] = this.tokens;
    let obj = this.data;
    let i: number;

    for (i = 0; i < tokens.length - 1; i++) {
      const token: string = tokens[i];
      if (typeof obj[token] !== "object") {
        throw new Error("Unable to set the target object");
      }
      obj = obj[token];
    }

    obj[tokens[i]] = value;
  }

  /**
   * Stop data observing
   */

  public unobserve(): void {
    if (!this.callback) {
      throw new Error("Not observing");
    }

    const tokens: string[] = this.tokens;
    const values: any[] = this.values;

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const obj: any = values[i];

      if (typeof obj === "object") {
        unobserveProperty(
          obj,
          token,
          this.update
        );
      }
    }

    this.callback = undefined;
    this.values = undefined;
  }

  /**
   * Function called on every change into the values path
   */

  private update(): void {
    const tokens: string[] = this.tokens;
    const oldValues: any[] = this.values;
    const newValues: any[] = this.realize();

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const oldValue: any = oldValues[i];
      const newValue: any = newValues[i];

      if (oldValue !== newValue) {
        if (typeof oldValue === "object") {
          unobserveProperty(oldValue, token, this.update);
        }
        if (typeof newValue === "object" && newValue !== null) {
          observeProperty(newValue, token, this.update);
        }
      }
    }

    const previousValue: any = oldValues[tokens.length];
    const currentValue: any = newValues[tokens.length];
    if (currentValue !== previousValue || isArray(currentValue)) {
      this.callback(currentValue, previousValue);
    }

    this.values = newValues;
  }

  /**
   * Return the full path valuse, including the root data object and the final value
   */

  private realize(): any[] {
    const values: any[] = [];
    let obj: any = this.data;

    for (const token of this.tokens) {
      values.push(obj);
      if (typeof obj === "object" && obj !== null) {
        obj = obj[token];
      } else {
        obj = undefined;
      }
    }
    values.push(obj);

    return values;
  }

}
