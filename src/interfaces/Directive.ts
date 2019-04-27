import { Expression } from "./Expression";

export interface Directive {
  expression: Expression;
  update: (value: any) => void;
  unbind: () => void;
}
