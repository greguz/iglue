export type Formatter = (value: any, ...args: any[]) => any;

export interface IFormatter {
  read: Formatter;
  write: Formatter;
}
