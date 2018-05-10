export type Formatter = (value: any, ...args: any[]) => any;

export interface IFormatter {
  pull: Formatter;
  push: Formatter;
}
