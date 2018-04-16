import { observe, unobserve } from './observe';

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

  private callback: (value: any) => void;

  /**
   * @constructor
   */

  constructor(data: any, path: string) {
    this.data = data;
    this.path = path;
    this.tokens = path.split('.');
    this.update = this.update.bind(this);
  }

  /**
   * Start data observing
   */

  public observe(callback: (value: any) => void): void {
    if (this.callback) {
      throw new Error('Currently observing');
    }

    this.callback = callback;

    const tokens: string[] = this.tokens;
    const values: any[] = this.realize();

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const obj: any = values[i];

      if (typeof obj === 'object') {
        observe(
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
      if (typeof obj === 'object') {
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
      if (typeof obj[token] !== 'object') {
        throw new Error('NOPE');
      }
      obj = obj[token];
    }

    obj[tokens[i]] = value;
  }

  /**
   * Stop data observing
   */

  public unobserve(): void {
    if (!this.values) {
      throw new Error('Not observing');
    }

    const tokens: string[] = this.tokens;
    const values: any[] = this.values;

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const obj: any = values[i];

      if (typeof obj === 'object') {
        unobserve(
          obj,
          token,
          this.update
        );
      }
    }

    this.values = undefined;
  }

  /**
   * Function called on every change into the values path
   */

  private update(): void {
    const tokens: string[] = this.tokens;
    const previousValues: any[] = this.values;
    const currentValues: any[] = this.realize();

    for (let i = 0; i < tokens.length; i++) {
      const token: string = tokens[i];
      const previous: any = previousValues[i];
      const current: any = currentValues[i];

      if (current !== previous) {
        if (typeof previous === 'object') {
          unobserve(previous, token, this.update);
        }
        if (typeof current === 'object') {
          observe(current, token, this.update);
        }
        if (i === tokens.length - 1) {
          this.callback(current);
        }
      }
    }

    this.values = currentValues;
  }

  /**
   * Get all path values
   */

  private realize(): any[] {
    const values: any[] = [];
    const tokens: string[] = this.tokens;
    let obj: any = this.data;
    let i: number;

    for (i = 0; i < tokens.length && typeof obj === 'object'; i++) {
      const token = tokens[i];
      values.push(obj);
      obj = obj[token];
    }

    return values;
  }

}
