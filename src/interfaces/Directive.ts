import { Expression } from "./Expression";

export interface Directive extends Expression {
  update: (value: any) => void;
  unbind: () => void;
}
