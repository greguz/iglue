export interface Formatter {
  /**
   * Transform the value when is retrieved from the context (JS > DOM)
   */
  pull: FormatterFunction;
  /**
   * Transform the value when is retrieved from the DOM (DOM > JS)
   */
  push: FormatterFunction;
}

export type FormatterFunction = (value: any, ...args: any[]) => any;
